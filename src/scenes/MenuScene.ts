import * as Phaser from 'phaser'
import { EVENTS, GAME_HEIGHT, GAME_WIDTH } from '../core/constants'
import { gameEvents } from '../core/events'
import { LEVELS, type LevelDefinition } from '../core/levels'
import { getAllLevelCompletions } from '../core/progress'
import { getEndlessRecord } from '../core/endless'

export class MenuScene extends Phaser.Scene {
  private clouds: Phaser.GameObjects.Image[] = []
  private parachuters: { image: Phaser.GameObjects.Image, speed: number, amplitude: number, phase: number, baseX: number }[] = []

  constructor() {
    super('MenuScene')
  }

  create() {
    const bg = this.add.graphics()
    bg.fillGradientStyle(0x3eaeff, 0x3eaeff, 0x9be0ff, 0x9be0ff, 1)
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

    this.generateTextures()
    this.initBackgroundElements()

    gameEvents.emit(EVENTS.menuEntered)

    const titleText = 'DataBloxx'
    const titleY = 160
    const titleFontSize = '56px'
    const blockyFont = '"Press Start 2P", system-ui, sans-serif'

    this.add.text(GAME_WIDTH / 2, titleY + 4, titleText, {
      color: '#004c21',
      fontFamily: blockyFont,
      fontSize: titleFontSize,
      stroke: '#004c21',
      strokeThickness: 22,
    }).setOrigin(0.5)

    this.add.text(GAME_WIDTH / 2, titleY + 8, titleText, {
      color: '#003366',
      fontFamily: blockyFont,
      fontSize: titleFontSize,
      stroke: '#003366',
      strokeThickness: 10,
    }).setOrigin(0.5)

    this.add.text(GAME_WIDTH / 2, titleY, titleText, {
      color: '#009900', 
      fontFamily: blockyFont,
      fontSize: titleFontSize,
      stroke: '#ffffff',
      strokeThickness: 8,
    }).setOrigin(0.5)

    this.add.text(GAME_WIDTH / 2, titleY, titleText, {
      color: '#00cc00',
      fontFamily: blockyFont,
      fontSize: titleFontSize,
    }).setOrigin(0.5)

    this.add
      .text(GAME_WIDTH / 2, 240, 'Choose a deployment target', {
        align: 'center',
        color: '#ffffff',
        fontFamily: blockyFont,
        fontSize: '12px',
        stroke: '#000000',
        strokeThickness: 4,
        wordWrap: { width: 430 },
      })
      .setOrigin(0.5)

    this.drawLevelGrid()
    this.drawEndlessButton()

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 24, 'Matter.js physics via Phaser 4', {
        color: '#ffffff',
        fontFamily: blockyFont,
        fontSize: '8px',
        stroke: '#000000',
        strokeThickness: 2,
      })
      .setOrigin(0.5)
  }

  update(_time: number, delta: number) {
    const wrapBuffer = 200

    this.clouds.forEach((cloud, index) => {
      const speed = 0.5 + (index % 3) * 0.2
      cloud.x += speed * (delta / 16)
      
      if (cloud.x > GAME_WIDTH + wrapBuffer) {
        cloud.x = -wrapBuffer
        cloud.y = Phaser.Math.Between(50, GAME_HEIGHT - 300)
      }
    })

    this.parachuters.forEach(p => {
      p.image.y += p.speed * (delta / 16)
      p.phase += 0.02 * (delta / 16)
      p.image.x = p.baseX + Math.sin(p.phase) * p.amplitude

      if (p.image.y > GAME_HEIGHT + wrapBuffer) {
        p.image.y = -wrapBuffer
        p.baseX = Phaser.Math.Between(50, GAME_WIDTH - 50)
        p.phase = Math.random() * Math.PI * 2
      }
    })
  }

  private generateTextures() {
    if (!this.textures.exists('cloud')) {
      const g = this.make.graphics({ x: 0, y: 0 })
      const r = 24
      const blocks = [
        [0, 0, r * 4.0, r * 1.5],
        [-r * 1.0, r * 0.5, r * 2.0, r * 1.0],
        [r * 1.0, r * 0.5, r * 2.5, r * 1.5],
        [0, -r * 0.5, r * 2.0, r * 1.0]
      ]
      g.fillStyle(0xffffff, 0.9)
      blocks.forEach(b => g.fillRect(r * 1.0 + b[0], r * 0.5 + b[1], b[2], b[3]))
      g.generateTexture('cloud', r * 5.5, r * 2.5)
      g.destroy()
    }

    if (!this.textures.exists('parachuter')) {
      const g = this.make.graphics({ x: 0, y: 0 })
      
      g.fillStyle(0xffffff, 1)
      g.beginPath()
      g.arc(20, 20, 18, Math.PI, 0)
      g.fill()
      
      g.lineStyle(2, 0xffffff, 1)
      g.beginPath()
      g.moveTo(4, 20)
      g.lineTo(20, 40)
      g.moveTo(36, 20)
      g.lineTo(20, 40)
      g.stroke()
      
      g.fillStyle(0xffffff, 1)
      g.fillRect(16, 40, 8, 12)
      
      g.fillStyle(0xffffff, 1)
      g.fillRect(16, 52, 3, 6)
      g.fillRect(21, 52, 3, 6)
      
      g.generateTexture('parachuter', 40, 60)
      g.destroy()
    }
  }

  private initBackgroundElements() {
    this.clouds = []
    this.parachuters = []

    for (let i = 0; i < 6; i++) {
        const x = Phaser.Math.Between(-100, GAME_WIDTH + 100)
        const y = Phaser.Math.Between(40, GAME_HEIGHT - 100)
        const cloud = this.add.image(x, y, 'cloud')
        cloud.setScale(0.6 + Math.random() * 0.6)
        cloud.setAlpha(0.7 + Math.random() * 0.3)
        cloud.setDepth(-2) 
        this.clouds.push(cloud)
    }

    const colors = [0xff2222, 0x2244ff, 0x44ff44, 0xffaa00]
    for (let i = 0; i < 4; i++) {
        const x = Phaser.Math.Between(50, GAME_WIDTH - 50)
        const y = Phaser.Math.Between(-100, GAME_HEIGHT)
        const parachuter = this.add.image(x, y, 'parachuter')
        const color = colors[i % colors.length]
        
        parachuter.setTint(color)
        parachuter.setScale(0.8 + Math.random() * 0.4)
        parachuter.setDepth(-1)
        
        this.parachuters.push({
            image: parachuter,
            speed: 1.5 + Math.random() * 1.5,
            amplitude: 20 + Math.random() * 30,
            phase: Math.random() * Math.PI * 2,
            baseX: x
        })
    }
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
    const startY = 320

    LEVELS.forEach((level, index) => {
      const column = index % columns
      const row = Math.floor(index / columns)
      const x = startX + column * (tileSize + gap)
      const y = startY + row * (tileSize + gap)
      const completion = completions[String(level.id)]

      const shadow = this.add.rectangle(x + 6, y + 6, tileSize, tileSize, 0x000000, 0.4)
      shadow.setOrigin(0)

      const tile = this.add.rectangle(x, y, tileSize, tileSize, completion ? 0xffea00 : 0xf1f5f9, 1)
      tile.setOrigin(0)
      tile.setStrokeStyle(4, 0x000000, 1)
      tile.setInteractive({ useHandCursor: true })
      tile.on('pointerdown', () => this.startGame(level))

      tile.on('pointerover', () => tile.setFillStyle(0xffffff))
      tile.on('pointerout', () => tile.setFillStyle(completion ? 0xffea00 : 0xf1f5f9))

      const numberY = completion ? y + tileSize / 2 - 12 : y + tileSize / 2
      this.add.text(x + tileSize / 2, numberY, String(level.id), {
        color: '#000000',
        fontFamily: '"Press Start 2P", system-ui, sans-serif',
        fontSize: '32px',
      }).setOrigin(0.5)

      if (completion) {
        let starsCount = 0
        if (completion.finalUptime >= 95) {
          starsCount = 3
        } else if (completion.finalUptime >= 87) {
          starsCount = 2
        } else if (completion.finalUptime >= 75) {
          starsCount = 1
        }

        const starsText = '★'.repeat(starsCount) + '☆'.repeat(3 - starsCount)
        this.add.text(x + tileSize / 2, y + tileSize - 18, starsText, {
          color: '#000000',
          fontSize: '26px',
        }).setOrigin(0.5)
      }
    })
  }

  private drawEndlessButton() {
    const endlessRecord = getEndlessRecord()
    const buttonWidth = 380
    const buttonHeight = 70
    const buttonX = GAME_WIDTH / 2
    const buttonY = GAME_HEIGHT - 120

    this.add.rectangle(buttonX + 6, buttonY + 6, buttonWidth, buttonHeight, 0x000000, 0.4)

    const graphics = this.add.graphics()
    graphics.fillStyle(0x000000, 1)
    graphics.fillRect(buttonX - buttonWidth / 2, buttonY - buttonHeight / 2, buttonWidth, buttonHeight)
    graphics.fillStyle(0xff8c00, 1)
    graphics.fillRect(buttonX - buttonWidth / 2 + 4, buttonY - buttonHeight / 2 + 4, buttonWidth - 8, buttonHeight - 8)
    
    graphics.setInteractive(
      new Phaser.Geom.Rectangle(buttonX - buttonWidth / 2, buttonY - buttonHeight / 2, buttonWidth, buttonHeight),
      Phaser.Geom.Rectangle.Contains,
    )
    
    graphics.on('pointerover', () => {
      graphics.clear()
      graphics.fillStyle(0x000000, 1)
      graphics.fillRect(buttonX - buttonWidth / 2, buttonY - buttonHeight / 2, buttonWidth, buttonHeight)
      graphics.fillStyle(0xffa500, 1)
      graphics.fillRect(buttonX - buttonWidth / 2 + 4, buttonY - buttonHeight / 2 + 4, buttonWidth - 8, buttonHeight - 8)
    })
    graphics.on('pointerout', () => {
      graphics.clear()
      graphics.fillStyle(0x000000, 1)
      graphics.fillRect(buttonX - buttonWidth / 2, buttonY - buttonHeight / 2, buttonWidth, buttonHeight)
      graphics.fillStyle(0xff8c00, 1)
      graphics.fillRect(buttonX - buttonWidth / 2 + 4, buttonY - buttonHeight / 2 + 4, buttonWidth - 8, buttonHeight - 8)
    })

    graphics.on('pointerdown', () => this.startEndless())

    this.add.text(buttonX, buttonY - 12, 'ENDLESS MODE', {
      color: '#ffffff',
      fontFamily: '"Press Start 2P", system-ui, sans-serif',
      fontSize: '20px',
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5)

    const recordText = endlessRecord ? `RECORD: ${endlessRecord.blockCount} BLOCKS` : 'RECORD: —'
    this.add.text(buttonX, buttonY + 16, recordText, {
      color: '#ffffff',
      fontFamily: '"Press Start 2P", system-ui, sans-serif',
      fontSize: '10px',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5)
  }
}
