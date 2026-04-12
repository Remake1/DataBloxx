import * as Phaser from 'phaser'
import { AssetKeys, getBlockAccentColor } from '../core/assets'
import type { BlockKind } from '../core/levels'

export class Effects {
  private readonly scene: Phaser.Scene

  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }

  pulse(x: number, y: number, _kind: BlockKind = 'server', perfect = true) {
    const color = 0xffcc00 // Gold pixel dust
    const particleCount = perfect ? 24 : 12
    
    for (let i = 0; i < particleCount; i++) {
      const particleSize = Phaser.Math.Between(4, 8)
      const particle = this.scene.add.rectangle(x, y, particleSize, particleSize, color)
      
      const angle = Phaser.Math.Between(0, 360) * (Math.PI / 180)
      const distance = Phaser.Math.Between(20, 110)
      
      this.scene.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance + 40,
        alpha: { from: 1, to: 0 },
        rotation: Phaser.Math.Between(-4, 4),
        duration: Phaser.Math.Between(500, 900),
        ease: 'Quad.Out',
        onComplete: () => particle.destroy(),
      })
    }
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
