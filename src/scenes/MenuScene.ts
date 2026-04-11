import * as Phaser from 'phaser'
import { GAME_HEIGHT, GAME_WIDTH } from '../core/constants'

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene')
  }

  create() {
    this.cameras.main.setBackgroundColor('#071111')
    this.addBackground()

    this.add
      .text(GAME_WIDTH / 2, 284, 'DataBloxx', {
        color: '#f4fbf8',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '58px',
        fontStyle: '800',
      })
      .setOrigin(0.5)

    this.add
      .text(GAME_WIDTH / 2, 348, 'Stack datacenter modules. Keep uptime high.', {
        align: 'center',
        color: '#9bb2ad',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '20px',
        wordWrap: { width: 430 },
      })
      .setOrigin(0.5)

    const start = this.add
      .text(GAME_WIDTH / 2, 488, 'Tap / click / space to deploy', {
        backgroundColor: '#55d6be',
        color: '#071111',
        fixedWidth: 310,
        fixedHeight: 48,
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '18px',
        fontStyle: '800',
        padding: { top: 13 },
        align: 'center',
      })
      .setOrigin(0.5)

    start.setInteractive({ useHandCursor: true })
    start.on('pointerdown', () => this.startGame())
    this.input.keyboard?.once('keydown-SPACE', () => this.startGame())
    this.input.once('pointerdown', () => this.startGame())

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 96, 'Matter.js physics via Phaser 4', {
        color: '#55726f',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '15px',
      })
      .setOrigin(0.5)
  }

  private startGame() {
    this.scene.start('GameScene')
  }

  private addBackground() {
    const graphics = this.add.graphics()
    graphics.lineStyle(1, 0x1c3533, 0.55)

    for (let x = 0; x <= GAME_WIDTH; x += 36) {
      graphics.lineBetween(x, 0, x, GAME_HEIGHT)
    }

    for (let y = 0; y <= GAME_HEIGHT; y += 36) {
      graphics.lineBetween(0, y, GAME_WIDTH, y)
    }

    graphics.fillStyle(0x55d6be, 0.08)
    graphics.fillCircle(96, 132, 170)
    graphics.fillStyle(0xffcc66, 0.08)
    graphics.fillCircle(440, 684, 220)
  }
}
