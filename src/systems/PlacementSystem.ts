import * as Phaser from 'phaser'
import { BLOCK, CRANE } from '../core/constants'
import { CraneArm } from '../entities/CraneArm'
import { DatacenterBlock } from '../entities/DatacenterBlock'
import type { BlockKind } from '../core/levels'

export class PlacementSystem {
  private canDrop = true
  private locked = false
  private nextWidth = BLOCK.maxWidth
  private nextKind: BlockKind = 'server'
  private readonly scene: Phaser.Scene
  private readonly crane: CraneArm

  constructor(scene: Phaser.Scene, crane: CraneArm) {
    this.scene = scene
    this.crane = crane
  }

  setNextBlock(width: number, kind: BlockKind) {
    this.nextWidth = width
    this.nextKind = kind
    this.crane.setPreviewWidth(width)
    this.crane.setPreviewTexture(kind)
  }

  tryDrop() {
    if (!this.canDrop) {
      return null
    }

    this.canDrop = false
    this.crane.setPreviewVisible(false)

    const drop = this.crane.getDropPoint()
    const block = new DatacenterBlock(this.scene, drop.x, drop.y, this.nextWidth, this.nextKind)
    block.setRotation(drop.rotation)
    block.setVelocity(drop.velocityX, CRANE.releaseDropVelocity)
    block.setAngularVelocity(drop.angularVelocity)

    this.scene.time.delayedCall(CRANE.spawnDelayMs, () => {
      if (this.locked) {
        return
      }
      this.canDrop = true
      this.crane.setPreviewVisible(true)
    })

    return block
  }

  setEnabled(enabled: boolean) {
    this.canDrop = enabled
    this.locked = !enabled
    this.crane.setPreviewVisible(enabled)
  }
}
