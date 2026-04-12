import * as Phaser from 'phaser'
import { getBlockAssetKey } from '../core/assets'
import { BLOCK } from '../core/constants'
import type { BlockKind } from '../core/levels'

export class DatacenterBlock extends Phaser.Physics.Matter.Sprite {
  readonly blockWidth: number
  readonly kind: BlockKind
  private scored = false
  private placementStressApplied = false
  private readonly createdAt: number

  constructor(scene: Phaser.Scene, x: number, y: number, width: number, kind: BlockKind = 'server') {
    super(scene.matter.world, x, y, getBlockAssetKey(kind))

    this.blockWidth = width
    this.kind = kind
    this.createdAt = scene.time.now
    scene.add.existing(this)
    this.setDisplaySize(width, BLOCK.height)
    this.setRectangle(width, BLOCK.height, {
      density: BLOCK.density,
      friction: BLOCK.friction,
      frictionStatic: BLOCK.frictionStatic,
      frictionAir: BLOCK.frictionAir,
      restitution: BLOCK.restitution,
    })
    this.setOrigin(0.5)
  }

  markScored() {
    this.scored = true
  }

  hasScored() {
    return this.scored
  }

  markPlacementStressApplied() {
    this.placementStressApplied = true
  }

  hasPlacementStressApplied() {
    return this.placementStressApplied
  }

  isSettled() {
    // Grace period: block must have had time to fall before it can count as settled
    if (this.scene.time.now - this.createdAt < 400) {
      return false
    }
    const body = this.body as MatterJS.BodyType
    return Math.abs(body.velocity.y) < 0.18 && Math.abs(body.angularVelocity) < 0.035
  }
}
