import * as Phaser from 'phaser'
import { EVENTS, GAME_HEIGHT, GAME_WIDTH } from '../core/constants'
import { gameEvents } from '../core/events'
import { LEVELS, type LevelDefinition } from '../core/levels'
import { getAllLevelCompletions } from '../core/progress'
import { getEndlessRecord } from '../core/endless'

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
    this.drawEndlessButton()

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 32, 'Matter.js physics via Phaser 4', {
        color: '#94a3b8',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '15px',
      })
      .setOrigin(0.5)
  }

  private startGame(level: LevelDefinition) {
    this.scene.start('GameScene', { levelId: level.id })
  }

  private startEndless() {
    this.scene.start('GameScene', { endless: true })
  }

  private drawLevelGrid() {
    const completions = getAllLevelCompletions()
    const columns = 3
    const tileSize = 100
    const gap = 30
    const totalWidth = columns * tileSize + (columns - 1) * gap
    const startX = GAME_WIDTH / 2 - totalWidth / 2
    const startY = 380

    // Draw regular levels
    LEVELS.forEach((level, index) => {
      const column = index % columns
      const row = Math.floor(index / columns)
      const x = startX + column * (tileSize + gap)
      const y = startY + row * (tileSize + gap)
      const completion = completions[String(level.id)]

      const tile = this.add.rectangle(x, y, tileSize, tileSize, 0xffffff, 0.9)
      tile.setOrigin(0)
      tile.setStrokeStyle(3, completion ? 0x3b82f6 : 0xcbd5e1, 1)
      tile.setInteractive({ useHandCursor: true })
      tile.on('pointerdown', () => this.startGame(level))

      const numberY = completion ? y + tileSize / 2 - 12 : y + tileSize / 2
      this.add.text(x + tileSize / 2, numberY, String(level.id), {
        color: completion ? '#3b82f6' : '#94a3b8',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '42px',
        fontStyle: '800',
      }).setOrigin(0.5)

      if (completion) {
        let starsCount = 1
        if (completion.finalUptime >= 90) {
          starsCount = 3
        } else if (completion.finalUptime >= 75) {
          starsCount = 2
        }

        const starsText = '★'.repeat(starsCount) + '☆'.repeat(3 - starsCount)
        this.add.text(x + tileSize / 2, y + tileSize - 22, starsText, {
          color: '#f59e0b',
          fontSize: '22px',
        }).setOrigin(0.5)
      }
    })
  }

  private drawEndlessButton() {
    const endlessRecord = getEndlessRecord()
    const buttonWidth = 380
    const buttonHeight = 70
    const buttonX = GAME_WIDTH / 2
    const buttonY = GAME_HEIGHT - 132
    const radius = 20

    // Create rounded rectangle button using graphics
    const graphics = this.add.graphics()
    graphics.fillStyle(0x3b82f6, 0.85)
    graphics.fillRoundedRect(buttonX - buttonWidth / 2, buttonY - buttonHeight / 2, buttonWidth, buttonHeight, radius)
    graphics.lineStyle(3, endlessRecord ? 0x1e40af : 0x60a5fa, 1)
    graphics.strokeRoundedRect(buttonX - buttonWidth / 2, buttonY - buttonHeight / 2, buttonWidth, buttonHeight, radius)
    graphics.setInteractive(
      new Phaser.Geom.Rectangle(buttonX - buttonWidth / 2, buttonY - buttonHeight / 2, buttonWidth, buttonHeight),
      Phaser.Geom.Rectangle.Contains,
    )
    graphics.on('pointerdown', () => this.startEndless())

    this.add.text(buttonX, buttonY - 12, 'Endless Gamemode', {
      color: '#ffffff',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '20px',
      fontStyle: '800',
    }).setOrigin(0.5)

    const recordText = endlessRecord ? `Personal record: ${endlessRecord.blockCount} blocks` : 'Personal record: —'
    this.add.text(buttonX, buttonY + 16, recordText, {
      color: '#ffffff',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '12px',
    }).setOrigin(0.5)
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
