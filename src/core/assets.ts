import type { BlockKind } from './levels'

export const AssetKeys = {
  block: 'datacenter-block',
  blockServer: 'block-server',
  blockNetwork: 'block-network',
  blockCooling: 'block-cooling',
  blockPower: 'block-power',
  floor: 'datacenter-floor',
  pixel: 'pixel',
  levelComplete: 'level-complete',
  connected: 'connected',
  levelFailed: 'level-failed',
  fallImpact: 'fall-impact',
  star: 'particle-star',
} as const

const BLOCK_THEME: Record<BlockKind, { bg: number; border: number; detail: number; led: number }> = {
  server:  { bg: 0x224444, border: 0x55d6be, detail: 0x7ee7d6, led: 0x55d6be },
  network: { bg: 0x1d3c52, border: 0x4eaaff, detail: 0x6ec4ff, led: 0x4eaaff },
  cooling: { bg: 0x3d2757, border: 0xb266ff, detail: 0xcc8aff, led: 0xb266ff },
  power:   { bg: 0x543e20, border: 0xffaa33, detail: 0xffc266, led: 0xffaa33 },
}

export function getBlockAssetKey(kind: BlockKind): string {
  const map: Record<BlockKind, string> = {
    server: AssetKeys.blockServer,
    network: AssetKeys.blockNetwork,
    cooling: AssetKeys.blockCooling,
    power: AssetKeys.blockPower,
  }
  return map[kind]
}

export function getBlockAccentColor(kind: BlockKind): number {
  return BLOCK_THEME[kind].border
}

export function createGeneratedAssets(scene: Phaser.Scene) {
  createPixel(scene)
  createStar(scene)
  createAllBlocks(scene)
  createFloor(scene)
}

function createStar(scene: Phaser.Scene) {
  const g = scene.add.graphics()
  g.fillStyle(0xffffff, 1)
  // Simple 5x5 pixel star:
  //   *  
  //  *** 
  // *****
  //  *** 
  // *   *
  g.fillRect(2, 0, 1, 1)
  g.fillRect(1, 1, 3, 1)
  g.fillRect(0, 2, 5, 1)
  g.fillRect(1, 3, 3, 1)
  g.fillRect(0, 4, 1, 1)
  g.fillRect(4, 4, 1, 1)
  
  g.generateTexture(AssetKeys.star, 5, 5)
  g.destroy()
}

function createPixel(scene: Phaser.Scene) {
  const graphics = scene.add.graphics()
  graphics.fillStyle(0xffffff, 1)
  graphics.fillRect(0, 0, 1, 1)
  graphics.generateTexture(AssetKeys.pixel, 1, 1)
  graphics.destroy()
}

function createAllBlocks(scene: Phaser.Scene) {
  createServerBlock(scene)
  createNetworkBlock(scene)
  createCoolingBlock(scene)
  createPowerBlock(scene)

  // Legacy alias — render server block under the generic key
  createBlockWithTheme(scene, AssetKeys.block, BLOCK_THEME.server, drawServerDetails)
}

function createServerBlock(scene: Phaser.Scene) {
  createBlockWithTheme(scene, AssetKeys.blockServer, BLOCK_THEME.server, drawServerDetails)
}

function createNetworkBlock(scene: Phaser.Scene) {
  createBlockWithTheme(scene, AssetKeys.blockNetwork, BLOCK_THEME.network, drawNetworkDetails)
}

function createCoolingBlock(scene: Phaser.Scene) {
  createBlockWithTheme(scene, AssetKeys.blockCooling, BLOCK_THEME.cooling, drawCoolingDetails)
}

function createPowerBlock(scene: Phaser.Scene) {
  createBlockWithTheme(scene, AssetKeys.blockPower, BLOCK_THEME.power, drawPowerDetails)
}

function createBlockWithTheme(
  scene: Phaser.Scene,
  key: string,
  theme: (typeof BLOCK_THEME)[BlockKind],
  detailFn: (g: Phaser.GameObjects.Graphics, w: number, h: number, theme: (typeof BLOCK_THEME)[BlockKind]) => void,
) {
  const width = 180
  const height = 70
  const g = scene.add.graphics()

  // Outline
  g.fillStyle(0x000000, 1)
  g.fillRect(0, 0, width, height)

  // Background fill (inner)
  g.fillStyle(theme.bg, 1)
  g.fillRect(4, 4, width - 8, height - 8)

  // Highlight border
  g.fillStyle(theme.border, 1)
  g.fillRect(4, 4, width - 8, 4) // top
  g.fillRect(4, 4, 4, height - 8) // left

  // Draw kind-specific detail
  detailFn(g, width, height, theme)

  // Status LED — top right square
  g.fillStyle(0x000000, 1)
  g.fillRect(width - 24, 16, 12, 12)
  g.fillStyle(theme.led, 1)
  g.fillRect(width - 20, 20, 4, 4)

  g.generateTexture(key, width, height)
  g.destroy()
}

/* ── Server: horizontal rack slots ─────────────────────────────── */
function drawServerDetails(
  g: Phaser.GameObjects.Graphics,
  w: number,
  _h: number,
  theme: (typeof BLOCK_THEME)[BlockKind],
) {
  // Dark slot bar across the top
  g.fillStyle(0x000000, 1)
  g.fillRect(16, 12, w - 48, 16)
  g.fillStyle(0x1a3130, 1)
  g.fillRect(20, 16, w - 56, 8)

  // Vertical rack-mount modules (squares)
  for (let x = 16; x < w - 24; x += 20) {
    g.fillStyle(0x000000, 1)
    g.fillRect(x, 34, 16, 20)
    g.fillStyle(theme.detail, 1)
    g.fillRect(x + 4, 38, 8, 12)
  }
}

/* ── Network: port grid pattern ────────────────────────────────── */
function drawNetworkDetails(
  g: Phaser.GameObjects.Graphics,
  w: number,
  _h: number,
  theme: (typeof BLOCK_THEME)[BlockKind],
) {
  // Top header strip
  g.fillStyle(0x000000, 1)
  g.fillRect(16, 10, w - 48, 16)
  g.fillStyle(0x0e1f2d, 1)
  g.fillRect(20, 14, w - 56, 8)

  // Port grid — two rows of small squares, chunky
  for (let row = 0; row < 2; row++) {
    for (let x = 16; x < w - 24; x += 16) {
      g.fillStyle(0x000000, 1)
      g.fillRect(x, 32 + row * 16, 12, 12)
      g.fillStyle(theme.detail, 0.9)
      g.fillRect(x + 2, 34 + row * 16, 8, 8)
    }
  }
}

/* ── Cooling: fan grille + coolant pipe ────────────────────────── */
function drawCoolingDetails(
  g: Phaser.GameObjects.Graphics,
  w: number,
  _h: number,
  theme: (typeof BLOCK_THEME)[BlockKind],
) {
  // Two fan squares
  const fanY = 28
  for (const cx of [w * 0.25, w * 0.6]) {
    g.fillStyle(0x000000, 1)
    g.fillRect(cx, fanY, 32, 32)
    g.fillStyle(0x281a3a, 1)
    g.fillRect(cx + 4, fanY + 4, 24, 24)
    // Fan blades — simple plus pattern
    g.fillStyle(theme.detail, 0.8)
    g.fillRect(cx + 12, fanY + 4, 8, 24)
    g.fillRect(cx + 4, fanY + 12, 24, 8)
  }

  // Pipe at bottom
  g.fillStyle(0x000000, 1)
  g.fillRect(16, 62, w - 32, 8)
  g.fillStyle(theme.border, 0.8)
  g.fillRect(16, 62, w - 32, 4)
}

/* ── Power: battery cells + indicator bar ──────────────────────── */
function drawPowerDetails(
  g: Phaser.GameObjects.Graphics,
  w: number,
  _h: number,
  theme: (typeof BLOCK_THEME)[BlockKind],
) {
  // Battery cells — chunky rects
  const cellW = 16
  const cellH = 32
  const gap = 8
  const totalCells = 6
  const startX = (w - totalCells * (cellW + gap) + gap) / 2
  for (let i = 0; i < totalCells; i++) {
    g.fillStyle(0x000000, 1)
    g.fillRect(startX + i * (cellW + gap), 12, cellW, cellH)
    g.fillStyle(theme.detail, 0.85)
    g.fillRect(startX + i * (cellW + gap) + 4, 16, cellW - 8, cellH - 8)
  }

  // Power indicator bar at bottom
  g.fillStyle(0x000000, 1)
  g.fillRect(16, 52, w - 48, 12)
  g.fillStyle(0x2a1e0a, 1)
  g.fillRect(20, 56, w - 56, 4)
  g.fillStyle(theme.led, 0.9)
  g.fillRect(20, 56, (w - 56) * 0.75, 4)
}

function createFloor(scene: Phaser.Scene) {
  const width = 620
  const height = 86
  const graphics = scene.add.graphics()

  graphics.fillStyle(0x1a1a1a, 1) // Outline
  graphics.fillRect(0, 0, width, height)
  
  graphics.fillStyle(0x3e464c, 1) // Dark concrete base
  graphics.fillRect(4, 4, width - 8, height - 8)
  
  graphics.fillStyle(0x5a656c, 1) // Platform edge highlight
  graphics.fillRect(4, 4, width - 8, 4)
  
  // Concrete expansion joints blocky
  graphics.fillStyle(0x1f2428, 1)
  for (let x = 40; x < width; x += 80) {
    graphics.fillRect(x, 8, 4, height - 8)
  }

  graphics.generateTexture(AssetKeys.floor, width, height)
  graphics.destroy()
}
