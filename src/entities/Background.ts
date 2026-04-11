import * as Phaser from 'phaser'
import { GAME_HEIGHT, GAME_WIDTH, WORLD } from '../core/constants'
import type { TerrainTheme } from '../core/levels'

interface ThemePalette {
  farHill: number
  midHill: number
  nearHill: number
  ground: number
  subGround: number
}

const PALETTES: Record<TerrainTheme, ThemePalette> = {
  plain: {
    farHill: 0x9ad68c,
    midHill: 0x6dbe5e,
    nearHill: 0x4aaa3e,
    ground: 0x3d9432,
    subGround: 0x2e7a26,
  },
  forest: {
    farHill: 0x5a8c6a,
    midHill: 0x3e7250,
    nearHill: 0x2b5e3e,
    ground: 0x1f4a2e,
    subGround: 0x163a22,
  },
  desert: {
    farHill: 0xf0d8a0,
    midHill: 0xe0c480,
    nearHill: 0xd4b060,
    ground: 0xc89e48,
    subGround: 0xb08838,
  },
  city: {
    farHill: 0x6e7488,
    midHill: 0x555c70,
    nearHill: 0x44495a,
    ground: 0x383c4a,
    subGround: 0x2a2e3a,
  },
}

/** Horizon line: where terrain begins (world Y) */
const HORIZON_Y = WORLD.floorY - 220

/** How far below floor to extend the ground fill */
const GROUND_DEPTH = 600

export class Background {
  private readonly scene: Phaser.Scene

  constructor(scene: Phaser.Scene, theme: TerrainTheme) {
    this.scene = scene
    this.drawSky()
    this.drawClouds()
    this.drawTerrain(theme)
  }

  /* ── Sky ─────────────────────────────────────────────────────── */

  private drawSky() {
    const g = this.scene.add.graphics()
    g.setDepth(-12)

    // Gradient sky: 6 bands from deep sky blue at the top to pale blue at horizon
    const bands: Array<{ from: number; to: number; color: number }> = [
      { from: WORLD.topY, to: WORLD.topY + 500, color: 0x4a90d9 },
      { from: WORLD.topY + 500, to: WORLD.topY + 1000, color: 0x5ea4e6 },
      { from: WORLD.topY + 1000, to: WORLD.topY + 1600, color: 0x72b4ee },
      { from: WORLD.topY + 1600, to: HORIZON_Y - 200, color: 0x87ceeb },
      { from: HORIZON_Y - 200, to: HORIZON_Y, color: 0xa8ddf4 },
      { from: HORIZON_Y, to: GAME_HEIGHT + GROUND_DEPTH, color: 0xc2e8fa },
    ]

    for (const band of bands) {
      g.fillStyle(band.color, 1)
      g.fillRect(-40, band.from, GAME_WIDTH + 80, band.to - band.from)
    }
  }

  /* ── Clouds ──────────────────────────────────────────────────── */

  private drawClouds() {
    const g = this.scene.add.graphics()
    g.setDepth(-11)

    const clouds = [
      { cx: 90, cy: HORIZON_Y - 380, scale: 1.0 },
      { cx: 340, cy: HORIZON_Y - 450, scale: 0.7 },
      { cx: 460, cy: HORIZON_Y - 340, scale: 0.85 },
      { cx: 180, cy: HORIZON_Y - 540, scale: 0.6 },
    ]

    for (const cloud of clouds) {
      this.drawCloud(g, cloud.cx, cloud.cy, cloud.scale)
    }
  }

  private drawCloud(g: Phaser.GameObjects.Graphics, cx: number, cy: number, scale: number) {
    g.fillStyle(0xffffff, 0.7)
    const r = 22 * scale
    // Cluster of overlapping circles
    g.fillEllipse(cx, cy, r * 3.4, r * 1.6)
    g.fillEllipse(cx - r * 1.1, cy + r * 0.2, r * 2.2, r * 1.2)
    g.fillEllipse(cx + r * 1.2, cy + r * 0.15, r * 2.6, r * 1.3)
    g.fillEllipse(cx + r * 0.2, cy - r * 0.4, r * 2.0, r * 1.1)
  }

  /* ── Terrain ─────────────────────────────────────────────────── */

  private drawTerrain(theme: TerrainTheme) {
    const palette = PALETTES[theme]

    // Three layered hill silhouettes back-to-front
    this.drawHillLayer(-10, palette.farHill, HORIZON_Y, 38, 0.008, 0)
    this.drawHillLayer(-9, palette.midHill, HORIZON_Y + 46, 28, 0.012, 42)
    this.drawHillLayer(-8, palette.nearHill, HORIZON_Y + 90, 20, 0.018, 17)

    // Flat ground fill from near-hill base to below world
    const groundG = this.scene.add.graphics()
    groundG.setDepth(-7)
    groundG.fillStyle(palette.ground, 1)
    groundG.fillRect(-40, HORIZON_Y + 100, GAME_WIDTH + 80, GROUND_DEPTH)

    // Subterranean stripe for extra depth
    groundG.fillStyle(palette.subGround, 1)
    groundG.fillRect(-40, WORLD.floorY + 20, GAME_WIDTH + 80, GROUND_DEPTH)

    // Theme-specific decorations
    switch (theme) {
      case 'plain':
        this.drawPlainDetails(palette)
        break
      case 'forest':
        this.drawForestDetails(palette)
        break
      case 'desert':
        this.drawDesertDetails(palette)
        break
      case 'city':
        this.drawCityDetails(palette)
        break
    }
  }

  private drawHillLayer(
    depth: number,
    color: number,
    baseY: number,
    amplitude: number,
    frequency: number,
    seed: number,
  ) {
    const g = this.scene.add.graphics()
    g.setDepth(depth)
    g.fillStyle(color, 1)
    g.beginPath()
    g.moveTo(-40, GAME_HEIGHT + GROUND_DEPTH)

    for (let x = -40; x <= GAME_WIDTH + 40; x += 4) {
      const y =
        baseY +
        Math.sin(x * frequency + seed) * amplitude +
        Math.sin(x * frequency * 2.3 + seed * 1.7) * amplitude * 0.4 +
        Math.sin(x * frequency * 0.5 + seed * 3.1) * amplitude * 0.6
      g.lineTo(x, y)
    }

    g.lineTo(GAME_WIDTH + 40, GAME_HEIGHT + GROUND_DEPTH)
    g.closePath()
    g.fill()
  }

  /* ── Plain: bushes and flowers ───────────────────────────────── */

  private drawPlainDetails(_palette: ThemePalette) {
    const g = this.scene.add.graphics()
    g.setDepth(-6)

    // Small bushes
    const bushPositions = [30, 110, 200, 310, 400, 470, 520]
    for (const bx of bushPositions) {
      const by = HORIZON_Y + 100 + Math.sin(bx * 0.05) * 8
      g.fillStyle(0x3a8c30, 1)
      g.fillEllipse(bx, by, 24, 14)
      g.fillStyle(0x48a83c, 1)
      g.fillEllipse(bx + 4, by - 3, 18, 10)
    }

    // Tiny flowers
    const flowerColors = [0xff6b8a, 0xffdd44, 0xff9944, 0xee55ee]
    for (let i = 0; i < 16; i++) {
      const fx = 20 + ((i * 137 + 29) % (GAME_WIDTH - 40))
      const fy = HORIZON_Y + 94 + Math.sin(fx * 0.06) * 6
      g.fillStyle(flowerColors[i % flowerColors.length], 1)
      g.fillCircle(fx, fy, 3)
      g.fillStyle(0x2d7a26, 1)
      g.fillRect(fx - 0.5, fy, 1, 8)
    }
  }

  /* ── Forest: pine trees ──────────────────────────────────────── */

  private drawForestDetails(_palette: ThemePalette) {
    const g = this.scene.add.graphics()
    g.setDepth(-6)

    // Far tree row (smaller, lighter)
    for (let i = 0; i < 14; i++) {
      const tx = 15 + ((i * 97 + 13) % (GAME_WIDTH - 20))
      const ty = HORIZON_Y + 60 + Math.sin(tx * 0.02) * 10
      this.drawPineTree(g, tx, ty, 0.55, 0x3d7048, 0x50382a)
    }

    // Near tree row (larger, darker)
    for (let i = 0; i < 9; i++) {
      const tx = 30 + ((i * 131 + 47) % (GAME_WIDTH - 40))
      const ty = HORIZON_Y + 96 + Math.sin(tx * 0.03) * 6
      this.drawPineTree(g, tx, ty, 0.85, 0x2d5e38, 0x4a3020)
    }
  }

  private drawPineTree(
    g: Phaser.GameObjects.Graphics,
    x: number,
    groundY: number,
    scale: number,
    foliage: number,
    trunk: number,
  ) {
    const h = 40 * scale
    // Trunk
    g.fillStyle(trunk, 1)
    g.fillRect(x - 2 * scale, groundY - h * 0.4, 4 * scale, h * 0.4)
    // Three triangle layers
    for (let layer = 0; layer < 3; layer++) {
      const ly = groundY - h * 0.35 - layer * h * 0.22
      const lw = (16 - layer * 4) * scale
      g.fillStyle(foliage, 1)
      g.fillTriangle(x, ly - h * 0.26, x - lw, ly, x + lw, ly)
    }
  }

  /* ── Desert: dunes and cacti ─────────────────────────────────── */

  private drawDesertDetails(_palette: ThemePalette) {
    const g = this.scene.add.graphics()
    g.setDepth(-6)

    // Cacti
    const cactiPositions = [55, 160, 290, 380, 480]
    for (const cx of cactiPositions) {
      const cy = HORIZON_Y + 94 + Math.sin(cx * 0.04) * 6
      this.drawCactus(g, cx, cy)
    }

    // Small rocks
    g.fillStyle(0xb09060, 1)
    for (let i = 0; i < 8; i++) {
      const rx = 40 + ((i * 113 + 73) % (GAME_WIDTH - 60))
      const ry = HORIZON_Y + 98 + Math.sin(rx * 0.05) * 4
      g.fillEllipse(rx, ry, 10, 6)
    }
  }

  private drawCactus(g: Phaser.GameObjects.Graphics, x: number, groundY: number) {
    g.fillStyle(0x5a9a38, 1)

    // Main stem
    g.fillRect(x - 4, groundY - 36, 8, 36)

    // Left arm
    g.fillRect(x - 16, groundY - 28, 12, 5)
    g.fillRect(x - 16, groundY - 28, 5, 14)

    // Right arm
    g.fillRect(x + 4, groundY - 20, 12, 5)
    g.fillRect(x + 11, groundY - 20, 5, 12)

    // Highlight
    g.fillStyle(0x6aaa48, 1)
    g.fillRect(x - 2, groundY - 34, 4, 32)
  }

  /* ── City: building silhouettes with windows ─────────────────── */

  private drawCityDetails(_palette: ThemePalette) {
    const g = this.scene.add.graphics()
    g.setDepth(-6)

    // Far skyline
    const buildings = [
      { x: 10, w: 36, h: 70 },
      { x: 50, w: 28, h: 48 },
      { x: 82, w: 44, h: 90 },
      { x: 130, w: 32, h: 55 },
      { x: 170, w: 50, h: 110 },
      { x: 225, w: 30, h: 44 },
      { x: 260, w: 42, h: 78 },
      { x: 308, w: 38, h: 62 },
      { x: 350, w: 52, h: 100 },
      { x: 406, w: 28, h: 50 },
      { x: 440, w: 46, h: 86 },
      { x: 492, w: 34, h: 58 },
    ]

    for (const b of buildings) {
      const by = HORIZON_Y + 100 - b.h
      // Building body
      g.fillStyle(0x3a3e4e, 1)
      g.fillRect(b.x, by, b.w, b.h)

      // Roof edge
      g.fillStyle(0x4a4e60, 1)
      g.fillRect(b.x, by, b.w, 4)

      // Windows: grid of tiny lit squares
      g.fillStyle(0xffe88a, 0.7)
      for (let wy = by + 10; wy < by + b.h - 8; wy += 12) {
        for (let wx = b.x + 6; wx < b.x + b.w - 6; wx += 10) {
          // Some windows are dark (pseudorandom)
          if ((wx * 7 + wy * 13) % 5 !== 0) {
            g.fillRect(wx, wy, 5, 5)
          }
        }
      }
    }

    // Antenna on tallest building
    g.lineStyle(2, 0x6a6e80, 1)
    g.lineBetween(195, HORIZON_Y - 14, 195, HORIZON_Y + 100 - 110)
    g.fillStyle(0xff3333, 1)
    g.fillCircle(195, HORIZON_Y - 14, 3)
  }

}
