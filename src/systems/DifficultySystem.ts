import { BLOCK } from '../core/constants'

export class DifficultySystem {
  getCraneSpeed(blocksPlaced: number) {
    return Math.min(2.35, 0.86 + blocksPlaced * 0.075)
  }

  getNextBlockWidth(blocksPlaced: number) {
    const shrink = Math.min(40, blocksPlaced * 2.4)
    return Math.round(BLOCK.maxWidth - shrink + Math.sin(blocksPlaced * 1.8) * 10)
  }

  clampBlockWidth(width: number) {
    return Math.max(BLOCK.minWidth, Math.min(BLOCK.maxWidth, width))
  }
}
