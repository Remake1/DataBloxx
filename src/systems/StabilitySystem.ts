import * as Phaser from 'phaser'
import { BLOCK, WORLD } from '../core/constants'
import type { DatacenterBlock } from '../entities/DatacenterBlock'

export class StabilitySystem {
  getUptime(blocks: DatacenterBlock[]) {
    const towerBlocks = blocks.filter((block) => block.hasScored())

    if (towerBlocks.length <= 1) {
      return 100
    }

    const straightnessCost = towerBlocks.reduce((sum, block, index) => {
      if (index === 0) {
        return sum + Math.abs(block.rotation) / WORLD.safeTiltRadians
      }

      const previousBlock = towerBlocks[index - 1]
      const overlapWidth = Math.min(block.blockWidth, previousBlock.blockWidth)
      const relativeOffset = Math.abs(block.x - previousBlock.x) / overlapWidth
      const relativeTilt = Math.abs(block.rotation - previousBlock.rotation) / WORLD.safeTiltRadians

      return sum + relativeOffset * 1.35 + relativeTilt * 0.55
    }, 0)

    const averageCost = straightnessCost / towerBlocks.length
    return Phaser.Math.Clamp(100 - averageCost * 70, 0, 100)
  }

  countBlocksTouchingFloor(blocks: DatacenterBlock[]) {
    const floorTopY = WORLD.floorY - WORLD.floorHeight / 2
    return blocks.filter((block) => block.getBounds().bottom >= floorTopY - BLOCK.floorTouchTolerance).length
  }

  hasFailed(blocks: DatacenterBlock[], uptime: number) {
    const fellBelowWorld = blocks.some((block) => block.y > WORLD.offscreenY)
    return uptime <= 0 || fellBelowWorld
  }

  getCameraTargetY(blocks: DatacenterBlock[]) {
    const settledBlocks = blocks.filter((block) => block.hasScored())

    if (settledBlocks.length === 0) {
      return 0
    }

    const highest = settledBlocks.reduce((minY, block) => Math.min(minY, block.y), WORLD.floorY)

    const followLine = this.getFollowLine(settledBlocks.length)

    if (highest > followLine) {
      return 0
    }

    return Math.max(WORLD.topY, highest - followLine)
  }

  private getFollowLine(settledBlockCount: number) {
    const progress = Phaser.Math.Clamp(settledBlockCount / WORLD.cameraFollowRampBlocks, 0, 1)
    return Phaser.Math.Linear(WORLD.cameraFollowStartLine, WORLD.cameraFollowEndLine, progress)
  }
}
