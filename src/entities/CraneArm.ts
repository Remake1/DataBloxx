import * as Phaser from 'phaser'
import { AssetKeys, getBlockAssetKey } from '../core/assets'
import { BLOCK, CRANE, GAME_WIDTH } from '../core/constants'
import type { BlockKind } from '../core/levels'

export class CraneArm {
  private readonly scene: Phaser.Scene
  private readonly cable: Phaser.GameObjects.Line
  private readonly beam: Phaser.GameObjects.Rectangle
  private readonly hook: Phaser.GameObjects.Arc
  private readonly preview: Phaser.GameObjects.Image
  private speed = 1
  private time = 0

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    this.beam = scene.add.rectangle(GAME_WIDTH / 2, CRANE.y - 22, 230, 14, 0x223a38)
    this.cable = scene.add.line(0, 0, 0, 0, 0, CRANE.cableLength, 0x9bb2ad, 0.85)
    this.hook = scene.add.circle(0, 0, 9, 0xffcc66)
    this.preview = scene.add
      .image(GAME_WIDTH / 2, CRANE.y + CRANE.cableLength + BLOCK.height / 2, AssetKeys.blockServer)
      .setDisplaySize(BLOCK.maxWidth, BLOCK.height)
      .setAlpha(0.86)
    this.beam.setScrollFactor(0)
    this.cable.setScrollFactor(0)
    this.hook.setScrollFactor(0)
    this.preview.setScrollFactor(0)
    this.update(0, 1)
  }

  update(deltaMs: number, speed: number) {
    this.speed = speed
    this.time += deltaMs * 0.001 * this.speed

    const x = GAME_WIDTH / 2 + Math.sin(this.time) * CRANE.swingAmplitude
    const y = CRANE.y
    this.beam.setX(x)
    this.cable.setPosition(x, y)
    this.hook.setPosition(x, y + CRANE.cableLength)
    this.preview.setPosition(x, y + CRANE.cableLength + BLOCK.height / 2)
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
    this.beam.setVisible(isVisible)
    this.cable.setVisible(isVisible)
    this.hook.setVisible(isVisible)
    this.preview.setVisible(isVisible)
  }
}
