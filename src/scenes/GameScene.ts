import * as Phaser from 'phaser'
import { AssetKeys } from '../core/assets'
import { EVENTS, GAME_HEIGHT, GAME_WIDTH, WORLD } from '../core/constants'
import { gameEvents } from '../core/events'
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
  private isGameOver = false

  constructor() {
    super('GameScene')
  }

  create() {
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
    gameEvents.emit(EVENTS.scoreChanged, this.scoring.getState())
    gameEvents.emit(EVENTS.gameStatus, 'Click, tap, or press space when the module is centered.')
  }

  update(_time: number, delta: number) {
    if (!this.crane || this.isGameOver) {
      return
    }

    this.crane.update(delta, this.difficulty.getCraneSpeed(this.blocks.length))
    this.scoreSettledBlocks()
    this.applyStability()
    this.moveCamera()
  }

  private dropBlock() {
    if (this.isGameOver || !this.placement) {
      this.scene.restart()
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
    this.prepareNextBlock()
  }

  private applyStability() {
    const penalty = this.stability.getPenalty(this.blocks)
    if (penalty > 0.1) {
      this.scoring.applyInstability(penalty)
      gameEvents.emit(EVENTS.scoreChanged, this.scoring.getState())
    }

    if (this.stability.hasFailed(this.blocks, this.scoring.getState().uptime)) {
      this.endGame()
    }
  }

  private prepareNextBlock() {
    const width = this.difficulty.clampBlockWidth(this.difficulty.getNextBlockWidth(this.blocks.length))
    this.placement?.setNextWidth(width)
  }

  private endGame() {
    if (this.isGameOver) {
      return
    }

    this.isGameOver = true
    this.placement?.setEnabled(false)
    gameEvents.emit(EVENTS.gameStatus, 'Outage. Tap or press space to rebuild.')
    this.time.delayedCall(420, () => {
      this.input.once('pointerdown', () => this.scene.restart())
      this.input.keyboard?.once('keydown-SPACE', () => this.scene.restart())
    })
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
