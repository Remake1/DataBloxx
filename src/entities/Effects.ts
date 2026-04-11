import * as Phaser from 'phaser'
import { AssetKeys, getBlockAccentColor } from '../core/assets'
import type { BlockKind } from '../core/levels'

export class Effects {
  private readonly scene: Phaser.Scene

  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }

  pulse(x: number, y: number, kind: BlockKind = 'server', perfect = true) {
    const color = perfect ? getBlockAccentColor(kind) : 0xffcc66
    const ring = this.scene.add.circle(x, y, 18)
    ring.setStrokeStyle(3, color, 0.9)
    this.scene.tweens.add({
      targets: ring,
      alpha: 0,
      scale: 2.6,
      duration: 420,
      ease: 'Cubic.Out',
      onComplete: () => ring.destroy(),
    })
  }

  spark(x: number, y: number, kind: BlockKind = 'server') {
    const color = getBlockAccentColor(kind)
    for (let index = 0; index < 10; index += 1) {
      const particle = this.scene.add.image(x, y, AssetKeys.pixel)
      particle.setTint(color)
      particle.setDisplaySize(4, 4)
      this.scene.tweens.add({
        targets: particle,
        x: x + Phaser.Math.Between(-46, 46),
        y: y + Phaser.Math.Between(-34, 12),
        alpha: 0,
        duration: 360,
        ease: 'Quad.Out',
        onComplete: () => particle.destroy(),
      })
    }
  }
}
