import * as Phaser from 'phaser'
import { AssetKeys } from '../core/assets'
import { BLOCK, EVENTS, GAME_HEIGHT, GAME_WIDTH, WORLD } from '../core/constants'
import { gameEvents } from '../core/events'
import { DEFAULT_LEVEL, getLevelById, type BlockKind, type LevelDefinition } from '../core/levels'
import { saveLevelCompletion } from '../core/progress'
import { saveEndlessRecord, type EndlessRecord } from '../core/endless'
import { Background } from '../entities/Background'
import { CraneArm } from '../entities/CraneArm'
import { DatacenterBlock } from '../entities/DatacenterBlock'
import { Effects } from '../entities/Effects'
import { DifficultySystem } from '../systems/DifficultySystem'
import { PlacementSystem } from '../systems/PlacementSystem'
import { ScoringSystem } from '../systems/ScoringSystem'
import { StabilitySystem } from '../systems/StabilitySystem'

export class GameScene extends Phaser.Scene {
  private blocks: DatacenterBlock[] = []
  private background?: Background
  private crane?: CraneArm
  private effects?: Effects
  private placement?: PlacementSystem
  private readonly scoring = new ScoringSystem()
  private readonly stability = new StabilitySystem()
  private readonly difficulty = new DifficultySystem()
  private level: LevelDefinition = DEFAULT_LEVEL
  private levelStartMs = 0
  private isGameOver = false
  private blockKindIndex = 0
  private lastImpactSoundMs = 0
  private isEndless = false
  private pendingCompletionAtMs = 0
  private windSpeed = 0
  private windDirection = 0
  private endlessBlockKinds: BlockKind[] = ['server', 'cooling', 'power', 'network']

  constructor() {
    super('GameScene')
  }

  create(data: { levelId?: number; endless?: boolean } = {}) {
    this.isEndless = data.endless ?? false
    this.level = this.isEndless ? { ...DEFAULT_LEVEL, terrain: 'chicago' } : getLevelById(data.levelId ?? DEFAULT_LEVEL.id)
    this.levelStartMs = this.time.now
    this.isGameOver = false
    this.blocks = []
    this.blockKindIndex = 0
    this.lastImpactSoundMs = 0
    this.pendingCompletionAtMs = 0
    this.scoring.reset()
    this.matter.resume()
    this.cameras.main.setBackgroundColor('#87ceeb')
    this.cameras.main.scrollY = 0
    this.matter.world.setBounds(
      0,
      WORLD.topY,
      GAME_WIDTH,
      GAME_HEIGHT + Math.abs(WORLD.topY) + 1200,
      40,
      false,
      false,
      false,
      true,
    )

    this.addGridOverlay()
    this.background = new Background(this, this.level.terrain)
    this.windSpeed = this.level.id === 9 ? Math.abs(this.background.getCloudWindSpeed()) : 0
    this.windDirection = this.level.id === 9 ? Math.sign(this.background.getCloudWindSpeed()) || 1 : 0
    this.addFoundation()

    this.crane = new CraneArm(this)
    this.effects = new Effects(this)
    this.placement = new PlacementSystem(this, this.crane)
    this.prepareNextBlock()

    this.input.on('pointerdown', () => this.dropBlock())
    this.input.keyboard?.on('keydown-SPACE', () => this.dropBlock())

    gameEvents.emit(EVENTS.gameReset, this.isEndless)
    gameEvents.emit(EVENTS.levelChanged, this.level)
    gameEvents.emit(EVENTS.scoreChanged, this.scoring.getState())
    gameEvents.emit(
      EVENTS.gameStatus,
      this.isEndless ? 'Endless Mode: place blocks for the highest record.' : `Level ${this.level.id}: place ${this.level.targetBlocks} stable blocks.`,
    )
  }

  update(_time: number, delta: number) {
    this.background?.update(delta)

    if (!this.crane || this.isGameOver) {
      return
    }

    this.applyWindToFallingBlocks(delta)

    const blocksPlaced = this.scoring.getState().blocks
    this.crane.update(
      delta,
      this.difficulty.getCraneSpeed(blocksPlaced),
      this.difficulty.getCraneArcHeight(blocksPlaced),
    )
    this.failFastCollapses()
    if (this.isGameOver) {
      return
    }
    this.scoreSettledBlocks()
    this.stabilizeSettledBlocks()
    this.dampenBlocksBelowView()
    this.applyStability()
    this.completeLevelIfStable()
    this.moveCamera()

    if (this.scoring.getState().combo > 1) {
      this.effects?.updateComboGlow(
        this.blocks.filter((b) => b.hasScored()),
        delta
      )
    }
  }

  private getNextBlockKind(): BlockKind {
    const kinds = this.isEndless ? this.endlessBlockKinds : this.level.blockKinds
    const kind = kinds[this.blockKindIndex % kinds.length]
    this.blockKindIndex += 1
    return kind
  }

  private dropBlock() {
    if (this.isGameOver || !this.placement) {
      return
    }

    const block = this.placement.tryDrop()
    if (!block) {
      return
    }

    this.blocks.push(block)
    this.effects?.spark(block.x, block.y - 22, block.kind)
    gameEvents.emit(EVENTS.gameStatus, 'Rack settling...')

    // Final block dropped — hide crane and prevent next preview
    if (!this.isEndless && this.blocks.length >= this.level.targetBlocks) {
      this.placement.setEnabled(false)
      this.crane?.setVisible(false)
    } else {
      this.prepareNextBlock()
    }
  }

  private applyWindToFallingBlocks(delta: number) {
    if (!this.windSpeed || this.windDirection === 0) {
      return
    }

    const deltaSeconds = delta * 0.001

    for (const block of this.blocks) {
      if (block.hasScored()) {
        continue
      }

      const body = block.body as MatterJS.BodyType
      if (body.velocity.y <= 0) {
        continue
      }

      // Apply wind only while the block is still falling and before it has reached the foundation
      if (block.y >= WORLD.floorY - 24) {
        continue
      }

      const heightRatio = Phaser.Math.Clamp((WORLD.floorY - block.y) / (WORLD.floorY - WORLD.topY), 0, 1)
      const windIntensity = 0.18 + 0.42 * heightRatio
      const windVelocityDelta = this.windSpeed * windIntensity * deltaSeconds

      this.matter.body.setVelocity(body, {
        x: body.velocity.x + this.windDirection * windVelocityDelta,
        y: body.velocity.y,
      })
    }
  }

  private scoreSettledBlocks() {
    const block = this.blocks.find((candidate) => !candidate.hasScored() && candidate.isSettled())
    if (!block) {
      return
    }

    const previousBlock = this.blocks[this.blocks.indexOf(block) - 1]
    const placementStress = this.getPlacementStress(block, previousBlock)
    if (placementStress.isDangerous) {
      if (block.hasPlacementStressApplied()) {
        this.scoring.triggerOutage()
        gameEvents.emit(EVENTS.scoreChanged, this.scoring.getState())
        this.failLevel()
        return
      }

      this.applyPlacementStress(block, placementStress, true)
      block.markPlacementStressApplied()
      this.playImpactSound()
      gameEvents.emit(EVENTS.gameStatus, 'Overhang detected. Load shifting...')
      return
    }

    const result = this.scoring.scorePlacement(block, previousBlock)
    block.markScored()
    this.applyPlacementStress(block, placementStress, false)
    this.scoring.setUptime(this.stability.getUptime(this.blocks))
    if (result.perfect) {
      this.playSound(AssetKeys.connected, 0.55)
    } else {
      this.playImpactSound()
    }
    this.effects?.pulse(block.x, block.y, block.kind, result.perfect)

    gameEvents.emit(EVENTS.scoreChanged, this.scoring.getState())
    gameEvents.emit(
      EVENTS.gameStatus,
      result.perfect ? 'Clean deployment. Combo boosted.' : 'Online, but latency risk increased.',
    )

    if (!this.isEndless && this.scoring.getState().blocks >= this.level.targetBlocks) {
      this.pendingCompletionAtMs = this.time.now + BLOCK.completionSettleDelayMs
      gameEvents.emit(EVENTS.gameStatus, 'Final rack settling...')
    }
  }

  private getPlacementStress(block: DatacenterBlock, previousBlock?: DatacenterBlock) {
    const anchorX = previousBlock?.x ?? WORLD.targetX
    const supportWidth = previousBlock ? Math.min(block.blockWidth, previousBlock.blockWidth) : block.blockWidth
    const offset = block.x - anchorX
    const offsetRatio = Math.abs(offset) / supportWidth

    return {
      direction: Math.sign(offset) || 1,
      offsetRatio,
      strength: Phaser.Math.Clamp(
        (offsetRatio - BLOCK.placementLeanStartRatio)
          / (BLOCK.placementDangerOverhangRatio - BLOCK.placementLeanStartRatio),
        0,
        1,
      ),
      isDangerous: Boolean(previousBlock) && offsetRatio >= BLOCK.placementDangerOverhangRatio,
    }
  }

  private applyPlacementStress(
    block: DatacenterBlock,
    stress: { direction: number; strength: number; offsetRatio: number },
    isDangerous: boolean,
  ) {
    if (stress.strength <= 0) {
      return
    }

    const body = block.body as MatterJS.BodyType
    const multiplier = isDangerous ? 1.85 : 1
    const angularVelocity = stress.direction * BLOCK.placementLeanAngularVelocity * stress.strength * multiplier
    const velocityX = stress.direction * BLOCK.placementLeanHorizontalVelocity * stress.strength * multiplier

    this.matter.body.setAngularVelocity(body, body.angularVelocity + angularVelocity)
    this.matter.body.setVelocity(body, {
      x: body.velocity.x + velocityX,
      y: body.velocity.y,
    })
  }

  private completeLevelIfStable() {
    if (this.isEndless || this.pendingCompletionAtMs === 0 || this.time.now < this.pendingCompletionAtMs) {
      return
    }

    if (!this.areScoredBlocksStable()) {
      return
    }

    this.completeLevel()
  }

  private areScoredBlocksStable() {
    return this.blocks
      .filter((block) => block.hasScored())
      .every((block) => {
        const body = block.body as MatterJS.BodyType
        return Math.abs(body.velocity.x) < 0.08
          && Math.abs(body.velocity.y) < 0.16
          && Math.abs(body.angularVelocity) < 0.025
      })
  }

  private failFastCollapses() {
    if (
      this.hasDroppedBlockBelowViewFailLine()
      || this.hasDroppedBlockTouchedFloor()
      || this.hasScoredBlockCollapsedBelowView()
      || this.hasScoredUpperBlockTouchedFloor()
    ) {
      this.scoring.triggerOutage()
      gameEvents.emit(EVENTS.scoreChanged, this.scoring.getState())
      this.failLevel()
    }
  }

  private applyStability() {
    const uptime = this.stability.getUptime(this.blocks)
    if (Math.abs(uptime - this.scoring.getState().uptime) > 0.05) {
      this.scoring.setUptime(uptime)
      gameEvents.emit(EVENTS.scoreChanged, this.scoring.getState())
    }

    if (this.stability.hasFailed(this.blocks, this.scoring.getState().uptime)) {
      this.failLevel()
    }
  }

  private hasDroppedBlockBelowViewFailLine() {
    const failLineY = this.cameras.main.scrollY + this.cameras.main.height + WORLD.belowViewFailLineOffset

    return this.blocks.some((block) => {
      if (block.hasScored() || block.getBounds().bottom < failLineY) {
        return false
      }

      const body = block.body as MatterJS.BodyType
      return body.velocity.y > -0.1
    })
  }

  private hasDroppedBlockTouchedFloor() {
    const floorTopY = WORLD.floorY - WORLD.floorHeight / 2

    return this.blocks.some((block, index) => {
      if (index === 0 || block.hasScored()) {
        return false
      }

      return block.getBounds().bottom >= floorTopY - BLOCK.floorTouchTolerance
    })
  }

  private hasScoredBlockCollapsedBelowView() {
    const failLineY = this.cameras.main.scrollY + this.cameras.main.height + WORLD.belowViewFailLineOffset

    return this.blocks.some((block, index) => {
      if (index === 0 || !block.hasScored() || block.getBounds().bottom < failLineY) {
        return false
      }

      const body = block.body as MatterJS.BodyType
      return body.velocity.y > 0.55 || Math.abs(body.angularVelocity) > 0.06
    })
  }

  private hasScoredUpperBlockTouchedFloor() {
    const floorTopY = WORLD.floorY - WORLD.floorHeight / 2

    return this.blocks.some((block, index) => {
      if (index === 0 || !block.hasScored()) {
        return false
      }

      return block.getBounds().bottom >= floorTopY - BLOCK.floorTouchTolerance
    })
  }

  /** Lightly damp scored blocks without making the tower feel locked in place. */
  private stabilizeSettledBlocks() {
    for (const block of this.blocks) {
      if (!block.hasScored()) {
        continue
      }

      const body = block.body as MatterJS.BodyType

      if (Math.abs(body.angularVelocity) > 0.004) {
        this.matter.body.setAngularVelocity(body, body.angularVelocity * 0.96)
      }

      if (Math.abs(body.velocity.x) > 0.04) {
        this.matter.body.setVelocity(body, {
          x: body.velocity.x * 0.96,
          y: body.velocity.y,
        })
      }
    }
  }

  private dampenBlocksBelowView() {
    const visibleBottomY = this.cameras.main.scrollY + this.cameras.main.height + BLOCK.height / 2

    for (const block of this.blocks) {
      if (!block.hasScored() || block.y <= visibleBottomY) {
        continue
      }

      const body = block.body as MatterJS.BodyType
      const dampedVelocityX = Math.abs(body.velocity.x) < 0.015 ? 0 : body.velocity.x * 0.55
      const dampedAngularVelocity = Math.abs(body.angularVelocity) < 0.0015 ? 0 : body.angularVelocity * 0.55

      this.matter.body.setVelocity(body, {
        x: dampedVelocityX,
        y: body.velocity.y,
      })
      this.matter.body.setAngularVelocity(body, dampedAngularVelocity)
    }
  }

  private prepareNextBlock() {
    const width = this.difficulty.clampBlockWidth(this.difficulty.getNextBlockWidth(this.blocks.length))
    const kind = this.getNextBlockKind()
    this.placement?.setNextBlock(width, kind)
  }

  private completeLevel() {
    if (this.isGameOver) {
      return
    }

    this.isGameOver = true
    this.playSound(AssetKeys.levelComplete, 0.85)
    this.placement?.setEnabled(false)
    this.crane?.setVisible(false)
    this.matter.pause()
    const state = this.scoring.getState()
    const timeMs = Math.max(0, this.time.now - this.levelStartMs)

    saveLevelCompletion({
      levelId: this.level.id,
      timeMs,
      finalUptime: state.uptime,
      completedAt: new Date().toISOString(),
    })

    gameEvents.emit(EVENTS.scoreChanged, state)
    gameEvents.emit(EVENTS.gameStatus, `Level ${this.level.id} complete.`)
    this.drawEndPanel('Deployment Complete', this.formatResult(timeMs, state.uptime), [
      { label: 'Retry', action: () => this.restartLevel() },
      { label: 'Exit', action: () => this.exitToMenu() },
    ])
  }

  private failLevel() {
    if (this.isGameOver) {
      return
    }

    this.isGameOver = true
    this.playSound(AssetKeys.levelFailed, 0.85)
    this.placement?.setEnabled(false)
    this.crane?.setVisible(false)

    if (this.isEndless) {
      const blocksPlaced = this.scoring.getState().blocks
      const height = this.calculateStackHeight()
      const record: EndlessRecord = {
        blockCount: blocksPlaced,
        height,
        score: this.scoring.getState().score,
        achievedAt: new Date().toISOString(),
      }
      saveEndlessRecord(record)
      gameEvents.emit(EVENTS.gameStatus, 'Tower collapsed. Record saved.')
      this.drawEndPanel('Tower Collapse', `${blocksPlaced} blocks placed • Score: ${this.scoring.getState().score}`, [
        { label: 'Retry', action: () => this.restartLevel() },
        { label: 'Exit', action: () => this.exitToMenu() },
      ])
    } else {
      gameEvents.emit(EVENTS.gameStatus, 'Outage. Retry or return to level select.')
      this.drawEndPanel('Deployment Failed', `Score: ${this.scoring.getState().score}`, [
        { label: 'Retry', action: () => this.restartLevel() },
        { label: 'Exit', action: () => this.exitToMenu() },
      ])
    }
  }

  private restartLevel() {
    this.scene.restart(this.isEndless ? { endless: true } : { levelId: this.level.id })
  }

  private exitToMenu() {
    this.scene.start('MenuScene')
  }

  private calculateStackHeight(): number {
    if (this.blocks.length === 0) {
      return 0
    }
    const lowestY = Math.min(...this.blocks.map((b) => b.y + b.displayHeight / 2))
    const highestY = Math.min(...this.blocks.map((b) => b.y - b.displayHeight / 2))
    return Math.abs(lowestY - highestY)
  }

  private drawEndPanel(
    title: string,
    subtitle: string,
    buttons: Array<{ label: string; action: () => void }>,
  ) {
    // Use camera world position for the panel so buttons remain clickable regardless of scroll
    const cam = this.cameras.main
    const centerWorldX = cam.scrollX + cam.width / 2
    const centerWorldY = cam.scrollY + cam.height / 2

    const panel = this.add.container(centerWorldX, centerWorldY)
    panel.setDepth(100)

    const backdrop = this.add.rectangle(0, 0, 380, 244, 0xffffff, 0.95)
    backdrop.setStrokeStyle(4, 0x3b82f6, 1)

    const titleText = this.add
      .text(0, -78, title, {
        align: 'center',
        color: '#1e293b',
        fontFamily: '"Press Start 2P", system-ui, sans-serif',
        fontSize: '18px',
        fontStyle: 'normal',
      })
      .setOrigin(0.5)

    const subtitleText = this.add
      .text(0, -34, subtitle, {
        align: 'center',
        color: '#64748b',
        fontFamily: '"Press Start 2P", system-ui, sans-serif',
        fontSize: '10px',
      })
      .setOrigin(0.5)

    panel.add([backdrop, titleText, subtitleText])

    buttons.forEach((button, index) => {
      const x = (index - (buttons.length - 1) / 2) * 126
      const buttonText = this.add
        .text(x, 58, button.label, {
          align: 'center',
          backgroundColor: index === 0 ? '#ffcc00' : '#e2e8f0',
          color: index === 0 ? '#000000' : '#000000',
          fixedWidth: 120,
          fixedHeight: 42,
          fontFamily: '"Press Start 2P", system-ui, sans-serif',
          fontSize: '12px',
          fontStyle: 'normal',
          padding: { top: 13 },
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })

      buttonText.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        pointer.event.stopPropagation()
        button.action()
      })
      panel.add(buttonText)
    })
  }

  private formatResult(timeMs: number, uptime: number) {
    return `${this.formatTime(timeMs)} / ${Math.round(uptime)}% final uptime`
  }

  private formatTime(timeMs: number) {
    const seconds = Math.max(0, Math.round(timeMs / 1000))
    const minutes = Math.floor(seconds / 60)
    return `${minutes}:${String(seconds % 60).padStart(2, '0')}`
  }

  private playImpactSound() {
    if (this.time.now - this.lastImpactSoundMs < 120) {
      return
    }

    this.lastImpactSoundMs = this.time.now
    this.playSound(AssetKeys.fallImpact, 0.5)
  }

  private playSound(key: string, volume: number) {
    if (!this.cache.audio.exists(key)) {
      return
    }

    this.sound.play(key, { volume })
  }

  private moveCamera() {
    const targetY = this.stability.getCameraTargetY(this.blocks)
    this.cameras.main.scrollY = Phaser.Math.Linear(this.cameras.main.scrollY, targetY, 0.04)
  }

  private addFoundation() {
    const floor = this.matter.add.image(GAME_WIDTH / 2, WORLD.floorY, AssetKeys.floor, undefined, {
      isStatic: true,
      friction: 1,
    })
    floor.setDisplaySize(GAME_WIDTH + 80, WORLD.floorHeight)
    floor.setRectangle(GAME_WIDTH + 80, WORLD.floorHeight, { isStatic: true, friction: 1 })
  }

  private addGridOverlay() {
    // Grid removed as per user request
  }
}
