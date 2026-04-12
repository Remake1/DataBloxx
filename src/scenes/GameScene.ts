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
    this.scoring.reset()
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
    this.addFoundation()

    this.crane = new CraneArm(this)
    this.effects = new Effects(this)
    this.placement = new PlacementSystem(this, this.crane)
    this.prepareNextBlock()

    this.input.on('pointerdown', () => this.dropBlock())
    this.input.keyboard?.on('keydown-SPACE', () => this.dropBlock())

    gameEvents.emit(EVENTS.gameReset)
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

    const blocksPlaced = this.scoring.getState().blocks
    this.crane.update(
      delta,
      this.difficulty.getCraneSpeed(blocksPlaced),
      this.difficulty.getCraneArcHeight(blocksPlaced),
    )
    this.scoreSettledBlocks()
    this.stabilizeSettledBlocks()
    this.dampenBlocksBelowView()
    this.applyStability()
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

  private scoreSettledBlocks() {
    const block = this.blocks.find((candidate) => !candidate.hasScored() && candidate.isSettled())
    if (!block) {
      return
    }

    const previousBlock = this.blocks[this.blocks.indexOf(block) - 1]
    const result = this.scoring.scorePlacement(block, previousBlock)
    block.markScored()
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
      this.completeLevel()
      return
    }
  }

  private applyStability() {
    if (this.hasFallingBlockBelowViewFailLine()) {
      this.scoring.triggerOutage()
      gameEvents.emit(EVENTS.scoreChanged, this.scoring.getState())
      this.failLevel()
      return
    }

    if (this.stability.countBlocksTouchingFloor(this.blocks) >= 2) {
      this.scoring.triggerOutage()
      gameEvents.emit(EVENTS.scoreChanged, this.scoring.getState())
      this.failLevel()
      return
    }

    const uptime = this.stability.getUptime(this.blocks)
    if (Math.abs(uptime - this.scoring.getState().uptime) > 0.05) {
      this.scoring.setUptime(uptime)
      gameEvents.emit(EVENTS.scoreChanged, this.scoring.getState())
    }

    if (this.stability.hasFailed(this.blocks, this.scoring.getState().uptime)) {
      this.failLevel()
    }
  }

  private hasFallingBlockBelowViewFailLine() {
    const failLineY = this.cameras.main.scrollY + this.cameras.main.height + WORLD.belowViewFailLineOffset

    return this.blocks.some((block) => {
      if (block.getBounds().bottom < failLineY) {
        return false
      }

      const body = block.body as MatterJS.BodyType
      return !block.hasScored() || body.velocity.y > 0.45
    })
  }

  /** Lightly damp scored blocks without making the tower feel locked in place. */
  private stabilizeSettledBlocks() {
    for (const block of this.blocks) {
      if (!block.hasScored()) {
        continue
      }

      const body = block.body as MatterJS.BodyType

      if (Math.abs(body.angularVelocity) > 0.0025) {
        this.matter.body.setAngularVelocity(body, body.angularVelocity * 0.90)
      }

      if (Math.abs(body.velocity.x) > 0.035) {
        this.matter.body.setVelocity(body, {
          x: body.velocity.x * 0.90,
          y: body.velocity.y,
        })
      }

      if (Math.abs(block.rotation) > 0.02) {
        const correctedAngle = block.rotation * 0.988
        this.matter.body.setAngle(body, correctedAngle)
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
      this.drawEndPanel('Tower Collapse', `${blocksPlaced} blocks placed • ${Math.round(height)}px`, [
        { label: 'Retry', action: () => this.restartLevel() },
        { label: 'Exit', action: () => this.exitToMenu() },
      ])
    } else {
      gameEvents.emit(EVENTS.gameStatus, 'Outage. Retry or return to level select.')
      this.drawEndPanel('Deployment Failed', 'Uptime target lost.', [
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
