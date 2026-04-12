import * as Phaser from 'phaser'
import { AssetKeys, getBlockAccentColor } from '../core/assets'
import type { BlockKind } from '../core/levels'

export class Effects {
  private readonly scene: Phaser.Scene

  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }

  pulse(x: number, y: number, _kind: BlockKind = 'server', perfect = true) {
    const color = perfect ? 0xffcc00 : 0x888888 // Gold pixel dust for perfect, gray otherwise
    const particleCount = perfect ? 24 : 12
    
    for (let i = 0; i < particleCount; i++) {
      const particleSize = perfect ? Phaser.Math.Between(5, 10) : Phaser.Math.Between(2, 5)

      const particle = perfect
        ? this.scene.add.image(x, y, AssetKeys.star).setTint(color).setDisplaySize(particleSize, particleSize)
        : this.scene.add.rectangle(x, y, particleSize, particleSize, color)
      
      const angle = Phaser.Math.Between(0, 360) * (Math.PI / 180)
      const distance = Phaser.Math.Between(20, 110)
      
      this.scene.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance + 40,
        alpha: { from: 1, to: 0 },
        duration: Phaser.Math.Between(250, 450),
        ease: 'Linear',
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
        duration: 200,
        ease: 'Linear',
        onComplete: () => particle.destroy(),
      })
    }
  }

  updateComboGlow(blocks: { x: number; y: number }[], delta: number) {
    if (blocks.length === 0) return

    // Spawn proportional to delta so it's frame-rate independent
    // ~12 particles per second across the tower
    const chance = (delta / 1000) * 12
    if (Math.random() < chance) {
      // Pick a random block from the tower
      const block = blocks[Phaser.Math.Between(0, blocks.length - 1)]
      
      // Give them a wider horizontal spread to appear in the air around the tower
      const x = block.x + Phaser.Math.Between(-140, 140)
      const y = block.y + Phaser.Math.Between(-35, 35)
      
      // Large 'shine' star particles to appear more "pixelous"
      const particleSize = Phaser.Math.Between(10, 18)
      const particle = this.scene.add.image(x, y, AssetKeys.star)
      particle.setTint(0xffea00)
      particle.setDisplaySize(particleSize, particleSize)
      
      this.scene.tweens.add({
        targets: particle,
        alpha: { from: 1, to: 0 },
        duration: Phaser.Math.Between(150, 400),
        ease: 'Linear',
        onComplete: () => particle.destroy(),
      })
    }
  }
}
