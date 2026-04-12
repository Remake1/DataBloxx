import * as Phaser from 'phaser'
import { BLOCK, CRANE } from '../core/constants'

export class DifficultySystem {
  getCraneSpeed(blocksPlaced: number) {
    return Math.min(1.85, 1.08 + blocksPlaced * 0.055)
  }

  getCraneArcHeight(blocksPlaced: number) {
    const progress = Phaser.Math.Clamp(
      (blocksPlaced - CRANE.arcRampStartBlocks) / CRANE.arcRampBlocks,
      0,
      1,
    )
    return Phaser.Math.Linear(CRANE.minArcHeight, CRANE.maxArcHeight, progress)
  }

  getNextBlockWidth(blocksPlaced: number) {
    const shrink = Math.min(40, blocksPlaced * 2.4)
    return Math.round(BLOCK.maxWidth - shrink + Math.sin(blocksPlaced * 1.8) * 10)
  }

  clampBlockWidth(width: number) {
    return Math.max(BLOCK.minWidth, Math.min(BLOCK.maxWidth, width))
  }
}
