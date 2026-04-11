import type { BlockKind } from './levels'

export const AssetKeys = {
  block: 'datacenter-block',
  blockServer: 'block-server',
  blockNetwork: 'block-network',
  blockCooling: 'block-cooling',
  blockPower: 'block-power',
  floor: 'datacenter-floor',
  pixel: 'pixel',
} as const

const BLOCK_THEME: Record<BlockKind, { bg: number; border: number; detail: number; led: number }> = {
  server:  { bg: 0x1a3130, border: 0x55d6be, detail: 0x7ee7d6, led: 0x55d6be },
  network: { bg: 0x162a3a, border: 0x4eaaff, detail: 0x6ec4ff, led: 0x4eaaff },
  cooling: { bg: 0x281a3a, border: 0xb266ff, detail: 0xcc8aff, led: 0xb266ff },
  power:   { bg: 0x3a2a14, border: 0xffaa33, detail: 0xffc266, led: 0xffaa33 },
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
  createAllBlocks(scene)
  createFloor(scene)
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

  // Background fill
  g.fillStyle(theme.bg, 1)
  g.fillRoundedRect(0, 0, width, height, 8)

  // Border stroke
  g.lineStyle(3, theme.border, 1)
  g.strokeRoundedRect(1.5, 1.5, width - 3, height - 3, 8)

  // Draw kind-specific detail
  detailFn(g, width, height, theme)

  // Status LED — top right
  g.fillStyle(theme.led, 1)
  g.fillCircle(width - 20, 18, 4)

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
  g.fillStyle(0x102221, 1)
  g.fillRect(14, 12, w - 28, 12)

  // Vertical rack-mount modules
  g.fillStyle(theme.detail, 1)
  for (let x = 18; x < w - 20; x += 18) {
    g.fillRoundedRect(x, 34, 10, 16, 3)
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
  g.fillStyle(0x0e1f2d, 1)
  g.fillRect(14, 10, w - 28, 10)

  // Port grid — two rows of small squares
  g.fillStyle(theme.detail, 0.9)
  for (let row = 0; row < 2; row++) {
    for (let x = 18; x < w - 24; x += 14) {
      g.fillRect(x, 28 + row * 14, 8, 8)
    }
  }

  // Connecting line between ports
  g.lineStyle(1, theme.border, 0.35)
  g.lineBetween(18, 55, w - 24, 55)
}

/* ── Cooling: fan grille + coolant pipe ────────────────────────── */
function drawCoolingDetails(
  g: Phaser.GameObjects.Graphics,
  w: number,
  _h: number,
  theme: (typeof BLOCK_THEME)[BlockKind],
) {
  // Two fan circles
  const fanRadius = 14
  const fanY = 35
  for (const cx of [w * 0.3, w * 0.6]) {
    g.lineStyle(2, theme.detail, 0.7)
    g.strokeCircle(cx, fanY, fanRadius)
    // Fan blades — X pattern
    g.lineStyle(2, theme.detail, 0.5)
    g.lineBetween(cx - 8, fanY - 8, cx + 8, fanY + 8)
    g.lineBetween(cx + 8, fanY - 8, cx - 8, fanY + 8)
  }

  // Coolant pipe at bottom
  g.lineStyle(3, theme.border, 0.45)
  g.lineBetween(14, 58, w - 14, 58)
  g.fillStyle(theme.led, 0.8)
  g.fillCircle(28, 58, 3)
  g.fillCircle(w - 28, 58, 3)
}

/* ── Power: battery cells + indicator bar ──────────────────────── */
function drawPowerDetails(
  g: Phaser.GameObjects.Graphics,
  w: number,
  _h: number,
  theme: (typeof BLOCK_THEME)[BlockKind],
) {
  // Battery cells — tall rounded rects
  g.fillStyle(theme.detail, 0.75)
  const cellW = 16
  const cellH = 30
  const gap = 6
  const totalCells = 6
  const startX = (w - totalCells * (cellW + gap) + gap) / 2
  for (let i = 0; i < totalCells; i++) {
    g.fillRoundedRect(startX + i * (cellW + gap), 14, cellW, cellH, 4)
  }

  // Power indicator bar at bottom
  g.fillStyle(0x2a1e0a, 1)
  g.fillRect(14, 52, w - 28, 8)
  g.fillStyle(theme.led, 0.9)
  g.fillRect(14, 52, (w - 28) * 0.75, 8)
}

function createFloor(scene: Phaser.Scene) {
  const width = 620
  const height = 86
  const graphics = scene.add.graphics()

  graphics.fillStyle(0x3e464c, 1) // Dark concrete base
  graphics.fillRoundedRect(0, 0, width, height, 6)
  
  graphics.fillStyle(0x2a3035, 1) // Platform edge shadow
  graphics.fillRect(0, 0, width, 12)
  
  // Concrete expansion joints
  graphics.lineStyle(3, 0x1f2428, 0.6)
  for (let x = 40; x < width; x += 80) {
    graphics.lineBetween(x, 12, x, height)
  }

  graphics.generateTexture(AssetKeys.floor, width, height)
  graphics.destroy()
}
