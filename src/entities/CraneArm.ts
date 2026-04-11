import * as Phaser from 'phaser'
import { AssetKeys, getBlockAssetKey } from '../core/assets'
import { BLOCK, CRANE, GAME_WIDTH } from '../core/constants'
import type { BlockKind } from '../core/levels'

export class CraneArm {
  private readonly scene: Phaser.Scene

  // Static Elements
  private readonly railTop: Phaser.GameObjects.Rectangle
  private readonly railBase: Phaser.GameObjects.Rectangle
  private readonly railHighlight: Phaser.GameObjects.Rectangle

  // Trolley
  private readonly trolleyMotor: Phaser.GameObjects.Rectangle
  private readonly trolleyBody: Phaser.GameObjects.Rectangle
  private readonly trolleyAccent: Phaser.GameObjects.Rectangle

  // Cables
  private readonly cableLeft: Phaser.GameObjects.Rectangle
  private readonly cableRight: Phaser.GameObjects.Rectangle

  // Hook block
  private readonly pulleyBlock: Phaser.GameObjects.Rectangle
  private readonly pulleyStripe: Phaser.GameObjects.Rectangle
  private readonly hookShaft: Phaser.GameObjects.Rectangle
  private readonly hookArc: Phaser.GameObjects.Arc

  // Game/Preview
  private readonly preview: Phaser.GameObjects.Image
  private speed = 1
  private time = 0

  constructor(scene: Phaser.Scene) {
    this.scene = scene

    // 1) Static rail (spans across the screen at the top)
    this.railTop = scene.add.rectangle(GAME_WIDTH / 2, CRANE.y - 34, GAME_WIDTH + 80, 16, 0x1a1d21)
    this.railBase = scene.add.rectangle(GAME_WIDTH / 2, CRANE.y - 24, GAME_WIDTH + 80, 8, 0x3b424a)
    this.railHighlight = scene.add.rectangle(GAME_WIDTH / 2, CRANE.y - 20, GAME_WIDTH + 80, 2, 0x6e7a88)

    // 2) Moving trolley
    this.trolleyMotor = scene.add.rectangle(0, CRANE.y - 36, 42, 20, 0x1e2227)
    this.trolleyBody = scene.add.rectangle(0, CRANE.y - 20, 68, 16, 0x24292e)
    this.trolleyAccent = scene.add.rectangle(0, CRANE.y - 17, 68, 6, 0xfacc15) // Industrial yellow

    // 3) Cables (using rects allows pixel-perfect connection logic without gap)
    this.cableLeft = scene.add.rectangle(0, 0, 2, 100, 0x8a949e)
    this.cableRight = scene.add.rectangle(0, 0, 2, 100, 0x8a949e)

    // 4) Hook block (with a J hook style)
    this.pulleyBlock = scene.add.rectangle(0, 0, 26, 18, 0x24292e)
    this.pulleyStripe = scene.add.rectangle(0, 0, 26, 6, 0xfacc15)
    
    this.hookShaft = scene.add.rectangle(0, 0, 4, 10, 0x8a949e)
    this.hookArc = scene.add.arc(0, 0, 5, 0, 180, false).setStrokeStyle(4, 0x8a949e)
    this.hookArc.isFilled = false

    // 5) Preview image
    this.preview = scene.add
      .image(GAME_WIDTH / 2, CRANE.y + CRANE.cableLength + BLOCK.height / 2, AssetKeys.blockServer)
      .setDisplaySize(BLOCK.maxWidth, BLOCK.height)
      .setAlpha(0.86)

    const allElements = [
      this.railTop, this.railBase, this.railHighlight,
      this.trolleyMotor, this.trolleyBody, this.trolleyAccent,
      this.cableLeft, this.cableRight,
      this.pulleyBlock, this.pulleyStripe,
      this.hookShaft, this.hookArc,
      this.preview
    ]

    allElements.forEach(el => el.setScrollFactor(0))
    this.update(0, 1)
  }

  update(deltaMs: number, speed: number) {
    this.speed = speed
    this.time += deltaMs * 0.001 * this.speed

    const x = GAME_WIDTH / 2 + Math.sin(this.time) * CRANE.swingAmplitude
    const y = CRANE.y

    // Trolley follows sine wave
    this.trolleyMotor.setX(x)
    this.trolleyBody.setX(x)
    this.trolleyAccent.setX(x)

    // Hook logic
    const hookY = y + CRANE.cableLength

    // The Pulley
    this.pulleyBlock.setPosition(x, hookY - 18)
    this.pulleyStripe.setPosition(x, hookY - 18)

    // The Hook (J shape)
    this.hookShaft.setPosition(x - 5, hookY - 10)
    this.hookArc.setPosition(x, hookY - 5)

    // Calculate exact height bridging the gap from trolley bottom to pulley top
    const trolleyBottom = y - 12
    const pulleyTop = hookY - 27
    const cableHeight = pulleyTop - trolleyBottom
    const cableCenterY = trolleyBottom + cableHeight / 2

    // Apply pixel-perfect bridging 
    this.cableLeft.setPosition(x - 6, cableCenterY)
    this.cableLeft.setDisplaySize(2, cableHeight)
    
    this.cableRight.setPosition(x + 6, cableCenterY)
    this.cableRight.setDisplaySize(2, cableHeight)

    // Preview at exact anchor point
    this.preview.setPosition(x, hookY + BLOCK.height / 2)
  }

  getDropPoint() {
    const worldPoint = this.scene.cameras.main.getWorldPoint(this.preview.x, this.preview.y)

    return {
      x: worldPoint.x,
      y: worldPoint.y,
      velocityX: Math.cos(this.time) * CRANE.releaseVelocity * this.speed,
    }
  }

  setPreviewWidth(width: number) {
    this.preview.setDisplaySize(width, BLOCK.height)
  }

  setPreviewTexture(kind: BlockKind) {
    this.preview.setTexture(getBlockAssetKey(kind))
  }

  setPreviewVisible(isVisible: boolean) {
    this.preview.setVisible(isVisible)
  }

  setVisible(isVisible: boolean) {
    const elements = [
      this.railTop, this.railBase, this.railHighlight,
      this.trolleyMotor, this.trolleyBody, this.trolleyAccent,
      this.cableLeft, this.cableRight,
      this.pulleyBlock, this.pulleyStripe,
      this.hookShaft, this.hookArc,
      this.preview
    ]
    elements.forEach(el => el.setVisible(isVisible))
  }
}
