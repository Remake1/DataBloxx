export const AssetKeys = {
  block: 'datacenter-block',
  floor: 'datacenter-floor',
  pixel: 'pixel',
} as const

export function createGeneratedAssets(scene: Phaser.Scene) {
  createPixel(scene)
  createBlock(scene)
  createFloor(scene)
}

function createPixel(scene: Phaser.Scene) {
  const graphics = scene.add.graphics()
  graphics.fillStyle(0xffffff, 1)
  graphics.fillRect(0, 0, 1, 1)
  graphics.generateTexture(AssetKeys.pixel, 1, 1)
  graphics.destroy()
}

function createBlock(scene: Phaser.Scene) {
  const width = 180
  const height = 70
  const graphics = scene.add.graphics()

  graphics.fillStyle(0x1a3130, 1)
  graphics.fillRoundedRect(0, 0, width, height, 8)
  graphics.lineStyle(3, 0x55d6be, 1)
  graphics.strokeRoundedRect(1.5, 1.5, width - 3, height - 3, 8)

  graphics.fillStyle(0x102221, 1)
  graphics.fillRect(14, 12, width - 28, 12)
  graphics.fillStyle(0x7ee7d6, 1)

  for (let x = 18; x < width - 20; x += 18) {
    graphics.fillRoundedRect(x, 34, 10, 16, 3)
  }

  graphics.fillStyle(0xffcc66, 1)
  graphics.fillCircle(width - 20, 18, 4)
  graphics.generateTexture(AssetKeys.block, width, height)
  graphics.destroy()
}

function createFloor(scene: Phaser.Scene) {
  const width = 620
  const height = 86
  const graphics = scene.add.graphics()

  graphics.fillStyle(0x172121, 1)
  graphics.fillRoundedRect(0, 0, width, height, 8)
  graphics.fillStyle(0x24413f, 1)
  graphics.fillRect(0, 0, width, 14)
  graphics.lineStyle(2, 0x55d6be, 0.6)

  for (let x = 24; x < width; x += 48) {
    graphics.lineBetween(x, 22, x + 24, height - 14)
  }

  graphics.generateTexture(AssetKeys.floor, width, height)
  graphics.destroy()
}
