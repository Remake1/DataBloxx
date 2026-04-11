import * as Phaser from 'phaser'
import { BLOCK, CRANE } from '../core/constants'
import { CraneArm } from '../entities/CraneArm'
import { DatacenterBlock } from '../entities/DatacenterBlock'

export class PlacementSystem {
  private canDrop = true
  private nextWidth = BLOCK.maxWidth
  private readonly scene: Phaser.Scene
  private readonly crane: CraneArm

  constructor(scene: Phaser.Scene, crane: CraneArm) {
    this.scene = scene
    this.crane = crane
  }

  setNextWidth(width: number) {
    this.nextWidth = width
    this.crane.setPreviewWidth(width)
  }

  tryDrop() {
    if (!this.canDrop) {
      return null
    }

    this.canDrop = false
    this.crane.setPreviewVisible(false)

    const drop = this.crane.getDropPoint()
    const block = new DatacenterBlock(this.scene, drop.x, drop.y, this.nextWidth)
    block.setVelocity(drop.velocityX, 0)
    block.setAngularVelocity(drop.velocityX * CRANE.releaseSpin)

    this.scene.time.delayedCall(CRANE.spawnDelayMs, () => {
      this.canDrop = true
      this.crane.setPreviewVisible(true)
    })

    return block
  }

  setEnabled(enabled: boolean) {
    this.canDrop = enabled
    this.crane.setPreviewVisible(enabled)
  }
}
