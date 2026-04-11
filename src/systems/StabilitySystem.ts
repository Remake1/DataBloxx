import * as Phaser from 'phaser'
import { WORLD } from '../core/constants'
import type { DatacenterBlock } from '../entities/DatacenterBlock'

export class StabilitySystem {
  getPenalty(blocks: DatacenterBlock[]) {
    if (blocks.length === 0) {
      return 0
    }

    const topBlocks = blocks.slice(-5)
    const tilt = topBlocks.reduce((sum, block) => sum + Math.abs(block.rotation), 0) / topBlocks.length
    const drift = Math.abs(topBlocks[topBlocks.length - 1].x - WORLD.targetX) / 160
    return Phaser.Math.Clamp((tilt / WORLD.safeTiltRadians + drift) * 0.2, 0, 2.8)
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
