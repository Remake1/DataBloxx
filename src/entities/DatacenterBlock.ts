import * as Phaser from 'phaser'
import { AssetKeys } from '../core/assets'
import { BLOCK } from '../core/constants'

export class DatacenterBlock extends Phaser.Physics.Matter.Sprite {
  readonly blockWidth: number
  private scored = false

  constructor(scene: Phaser.Scene, x: number, y: number, width: number) {
    super(scene.matter.world, x, y, AssetKeys.block)

    this.blockWidth = width
    scene.add.existing(this)
    this.setDisplaySize(width, BLOCK.height)
    this.setRectangle(width, BLOCK.height, {
      density: BLOCK.density,
      friction: BLOCK.friction,
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

  isSettled() {
    const body = this.body as MatterJS.BodyType
    return Math.abs(body.velocity.y) < 0.18 && Math.abs(body.angularVelocity) < 0.035
  }
}
