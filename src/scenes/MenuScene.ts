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
    this.cameras.main.setBackgroundColor('#87ceeb')
    this.addBackground()
    gameEvents.emit(EVENTS.menuEntered)

    this.add
      .text(GAME_WIDTH / 2, 284, 'DataBloxx', {
        color: '#000000',
        fontFamily: '"Press Start 2P", system-ui, sans-serif',
        fontSize: '32px',
      })
      .setOrigin(0.5)

    this.add
      .text(GAME_WIDTH / 2, 348, 'Choose a deployment target', {
        align: 'center',
        color: '#000000',
        fontFamily: '"Press Start 2P", system-ui, sans-serif',
        fontSize: '12px',
        wordWrap: { width: 430 },
      })
      .setOrigin(0.5)

    this.drawLevelGrid()
    this.drawEndlessButton()

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 32, 'Matter.js physics via Phaser 4', {
        color: '#ffffff',
        fontFamily: '"Press Start 2P", system-ui, sans-serif',
        fontSize: '8px',
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

      const tile = this.add.rectangle(x, y, tileSize, tileSize, completion ? 0xffcc00 : 0xe2e8f0, 1)
      tile.setOrigin(0)
      tile.setStrokeStyle(4, 0x000000, 1)
      tile.setInteractive({ useHandCursor: true })
      tile.on('pointerdown', () => this.startGame(level))

      const numberY = completion ? y + tileSize / 2 - 12 : y + tileSize / 2
      this.add.text(x + tileSize / 2, numberY, String(level.id), {
        color: '#000000',
        fontFamily: '"Press Start 2P", system-ui, sans-serif',
        fontSize: '24px',
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
          color: '#000000',
          fontSize: '28px',
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

    const graphics = this.add.graphics()
    graphics.fillStyle(0x000000, 1)
    graphics.fillRect(buttonX - buttonWidth / 2, buttonY - buttonHeight / 2, buttonWidth, buttonHeight)
    graphics.fillStyle(0x3b82f6, 1)
    graphics.fillRect(buttonX - buttonWidth / 2 + 4, buttonY - buttonHeight / 2 + 4, buttonWidth - 8, buttonHeight - 8)
    
    graphics.setInteractive(
      new Phaser.Geom.Rectangle(buttonX - buttonWidth / 2, buttonY - buttonHeight / 2, buttonWidth, buttonHeight),
      Phaser.Geom.Rectangle.Contains,
    )
    graphics.on('pointerdown', () => this.startEndless())

    this.add.text(buttonX, buttonY - 12, 'ENDLESS MODE', {
      color: '#ffffff',
      fontFamily: '"Press Start 2P", system-ui, sans-serif',
      fontSize: '14px',
    }).setOrigin(0.5)

    const recordText = endlessRecord ? `RECORD: ${endlessRecord.blockCount} BLOCKS` : 'RECORD: —'
    this.add.text(buttonX, buttonY + 14, recordText, {
      color: '#ffffff',
      fontFamily: '"Press Start 2P", system-ui, sans-serif',
      fontSize: '8px',
    }).setOrigin(0.5)
  }

  private addBackground() {
    const graphics = this.add.graphics()
    
    // Draw thick blocky clouds as background flavor
    const drawCloud = (cx: number, cy: number, scale: number) => {
      const r = 22 * scale
      const blocks = [
        [0, 0, r * 4.0, r * 1.5],
        [-r * 1.0, r * 0.5, r * 2.0, r * 1.0],
        [r * 1.0, r * 0.5, r * 2.5, r * 1.5],
        [0, -r * 0.5, r * 2.0, r * 1.0]
      ]
      graphics.fillStyle(0xffffff, 1)
      blocks.forEach(b => graphics.fillRect(cx + b[0], cy + b[1], b[2], b[3]))
    }

    drawCloud(100, 150, 1.2)
    drawCloud(400, 250, 0.8)
    drawCloud(150, 700, 1.0)
    drawCloud(450, 600, 1.5)
  }
}
