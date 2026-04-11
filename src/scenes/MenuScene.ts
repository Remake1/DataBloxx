import * as Phaser from 'phaser'
import { EVENTS, GAME_HEIGHT, GAME_WIDTH } from '../core/constants'
import { gameEvents } from '../core/events'
import { LEVELS, type LevelDefinition } from '../core/levels'
import { getAllLevelCompletions } from '../core/progress'

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene')
  }

  create() {
    this.cameras.main.setBackgroundColor('#f8fafc')
    this.addBackground()
    gameEvents.emit(EVENTS.menuEntered)

    this.add
      .text(GAME_WIDTH / 2, 284, 'DataBloxx', {
        color: '#1e293b',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '58px',
        fontStyle: '800',
      })
      .setOrigin(0.5)

    this.add
      .text(GAME_WIDTH / 2, 348, 'Choose a deployment target.', {
        align: 'center',
        color: '#64748b',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '20px',
        wordWrap: { width: 430 },
      })
      .setOrigin(0.5)

    this.drawLevelGrid()

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 96, 'Matter.js physics via Phaser 4', {
        color: '#94a3b8',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '15px',
      })
      .setOrigin(0.5)
  }

  private startGame(level: LevelDefinition) {
    this.scene.start('GameScene', { levelId: level.id })
  }

  private drawLevelGrid() {
    const completions = getAllLevelCompletions()
    const columns = 2
    const tileWidth = 196
    const tileHeight = 126
    const gap = 18
    const startX = GAME_WIDTH / 2 - tileWidth - gap / 2
    const startY = 420

    LEVELS.forEach((level, index) => {
      const column = index % columns
      const row = Math.floor(index / columns)
      const x = startX + column * (tileWidth + gap)
      const y = startY + row * (tileHeight + gap)
      const completion = completions[String(level.id)]

      const tile = this.add.rectangle(x, y, tileWidth, tileHeight, 0xffffff, 0.9)
      tile.setOrigin(0)
      tile.setStrokeStyle(3, completion ? 0x3b82f6 : 0xcbd5e1, 1)
      tile.setInteractive({ useHandCursor: true })
      tile.on('pointerdown', () => this.startGame(level))

      this.add.text(x + 16, y + 14, String(level.id).padStart(2, '0'), {
        color: completion ? '#3b82f6' : '#f59e0b',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '30px',
        fontStyle: '800',
      })

      this.add.text(x + 70, y + 18, level.name, {
        color: '#1e293b',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '16px',
        fontStyle: '800',
        wordWrap: { width: 106 },
      })

      this.add.text(x + 16, y + 62, `${level.targetBlocks} blocks required`, {
        color: '#64748b',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '14px',
      })

      this.add.text(x + 16, y + 88, this.getCompletionText(completion), {
        color: completion ? '#3b82f6' : '#94a3b8',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '13px',
      })
    })
  }

  private getCompletionText(completion: ReturnType<typeof getAllLevelCompletions>[string]) {
    if (!completion) {
      return 'Not completed'
    }

    return `${this.formatTime(completion.timeMs)} / ${Math.round(completion.finalUptime)}% uptime`
  }

  private formatTime(timeMs: number) {
    const seconds = Math.max(0, Math.round(timeMs / 1000))
    const minutes = Math.floor(seconds / 60)
    return `${minutes}:${String(seconds % 60).padStart(2, '0')}`
  }

  private addBackground() {
    const graphics = this.add.graphics()
    graphics.lineStyle(1, 0xffffff, 0.8)

    for (let x = 0; x <= GAME_WIDTH; x += 36) {
      graphics.lineBetween(x, 0, x, GAME_HEIGHT)
    }

    for (let y = 0; y <= GAME_HEIGHT; y += 36) {
      graphics.lineBetween(0, y, GAME_WIDTH, y)
    }

    graphics.fillStyle(0x38bdf8, 0.15)
    graphics.fillCircle(96, 132, 170)
    graphics.fillStyle(0xfbbf24, 0.15)
    graphics.fillCircle(440, 684, 220)
  }
}
