import * as Phaser from 'phaser'
import { AssetKeys } from '../core/assets'
import { EVENTS, GAME_HEIGHT, GAME_WIDTH, WORLD } from '../core/constants'
import { gameEvents } from '../core/events'
import { DEFAULT_LEVEL, getLevelById, type LevelDefinition } from '../core/levels'
import { saveLevelCompletion } from '../core/progress'
import { CraneArm } from '../entities/CraneArm'
import { DatacenterBlock } from '../entities/DatacenterBlock'
import { Effects } from '../entities/Effects'
import { DifficultySystem } from '../systems/DifficultySystem'
import { PlacementSystem } from '../systems/PlacementSystem'
import { ScoringSystem } from '../systems/ScoringSystem'
import { StabilitySystem } from '../systems/StabilitySystem'

export class GameScene extends Phaser.Scene {
  private blocks: DatacenterBlock[] = []
  private crane?: CraneArm
  private effects?: Effects
  private placement?: PlacementSystem
  private readonly scoring = new ScoringSystem()
  private readonly stability = new StabilitySystem()
  private readonly difficulty = new DifficultySystem()
  private level: LevelDefinition = DEFAULT_LEVEL
  private levelStartMs = 0
  private isGameOver = false

  constructor() {
    super('GameScene')
  }

  create(data: { levelId?: number } = {}) {
    this.level = getLevelById(data.levelId ?? DEFAULT_LEVEL.id)
    this.levelStartMs = this.time.now
    this.isGameOver = false
    this.blocks = []
    this.scoring.reset()
    this.cameras.main.setBackgroundColor('#071111')
    this.cameras.main.scrollY = 0
    this.matter.world.setBounds(
      0,
      WORLD.topY,
      GAME_WIDTH,
      GAME_HEIGHT + Math.abs(WORLD.topY) + 1200,
      40,
      true,
      true,
      false,
      true,
    )

    this.addBackground()
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
      `Level ${this.level.id}: place ${this.level.targetBlocks} stable blocks.`,
    )
  }

  update(_time: number, delta: number) {
    if (!this.crane || this.isGameOver) {
      return
    }

    this.crane.update(delta, this.difficulty.getCraneSpeed(this.scoring.getState().blocks))
    this.scoreSettledBlocks()
    this.applyStability()
    this.moveCamera()
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
    this.effects?.spark(block.x, block.y - 22)
    gameEvents.emit(EVENTS.gameStatus, 'Rack settling...')
  }

  private scoreSettledBlocks() {
    const block = this.blocks.find((candidate) => !candidate.hasScored() && candidate.isSettled())
    if (!block) {
      return
    }

    const previousBlock = this.blocks[this.blocks.indexOf(block) - 1]
    const result = this.scoring.scorePlacement(block, previousBlock)
    block.markScored()
    this.effects?.pulse(block.x, block.y, result.perfect ? 0x55d6be : 0xffcc66)
    gameEvents.emit(EVENTS.scoreChanged, result.state)
    gameEvents.emit(
      EVENTS.gameStatus,
      result.perfect ? 'Clean deployment. Combo boosted.' : 'Online, but latency risk increased.',
    )

    if (result.state.blocks >= this.level.targetBlocks) {
      this.completeLevel()
      return
    }

    this.prepareNextBlock()
  }

  private applyStability() {
    const penalty = this.stability.getPenalty(this.blocks)
    if (penalty > 0.1) {
      this.scoring.applyInstability(penalty)
      gameEvents.emit(EVENTS.scoreChanged, this.scoring.getState())
    }

    if (this.stability.hasFailed(this.blocks, this.scoring.getState().uptime)) {
      this.failLevel()
    }
  }

  private prepareNextBlock() {
    const width = this.difficulty.clampBlockWidth(this.difficulty.getNextBlockWidth(this.blocks.length))
    this.placement?.setNextWidth(width)
  }

  private completeLevel() {
    if (this.isGameOver) {
      return
    }

    this.isGameOver = true
    this.placement?.setEnabled(false)
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
    this.placement?.setEnabled(false)
    gameEvents.emit(EVENTS.gameStatus, 'Outage. Retry or return to level select.')
    this.drawEndPanel('Deployment Failed', 'Uptime target lost.', [
      { label: 'Retry', action: () => this.restartLevel() },
      { label: 'Exit', action: () => this.exitToMenu() },
    ])
  }

  private restartLevel() {
    this.scene.restart({ levelId: this.level.id })
  }

  private exitToMenu() {
    this.scene.start('MenuScene')
  }

  private drawEndPanel(
    title: string,
    subtitle: string,
    buttons: Array<{ label: string; action: () => void }>,
  ) {
    const panel = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2)
    panel.setScrollFactor(0)
    panel.setDepth(100)

    const backdrop = this.add.rectangle(0, 0, 380, 244, 0x071111, 0.92)
    backdrop.setStrokeStyle(2, 0x55d6be, 1)

    const titleText = this.add
      .text(0, -78, title, {
        align: 'center',
        color: '#f4fbf8',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '28px',
        fontStyle: '800',
      })
      .setOrigin(0.5)

    const subtitleText = this.add
      .text(0, -34, subtitle, {
        align: 'center',
        color: '#9bb2ad',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '16px',
      })
      .setOrigin(0.5)

    panel.add([backdrop, titleText, subtitleText])

    buttons.forEach((button, index) => {
      const x = (index - (buttons.length - 1) / 2) * 126
      const buttonText = this.add
        .text(x, 58, button.label, {
          align: 'center',
          backgroundColor: index === 0 ? '#55d6be' : '#24413f',
          color: index === 0 ? '#071111' : '#f4fbf8',
          fixedWidth: 112,
          fixedHeight: 42,
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: '16px',
          fontStyle: '800',
          padding: { top: 11 },
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })

      buttonText.on('pointerdown', button.action)
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

  private addBackground() {
    const graphics = this.add.graphics()
    graphics.lineStyle(1, 0x1c3533, 0.46)

    for (let x = 0; x <= GAME_WIDTH; x += 36) {
      graphics.lineBetween(x, -1200, x, GAME_HEIGHT + 1200)
    }

    for (let y = -1200; y <= GAME_HEIGHT + 1200; y += 36) {
      graphics.lineBetween(0, y, GAME_WIDTH, y)
    }

    graphics.fillStyle(0x102221, 1)
    graphics.fillRect(0, WORLD.floorY, GAME_WIDTH, GAME_HEIGHT - WORLD.floorY)
    graphics.setDepth(-5)
  }
}
