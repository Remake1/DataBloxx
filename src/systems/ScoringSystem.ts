import * as Phaser from 'phaser'
import { WORLD } from '../core/constants'
import type { DatacenterBlock } from '../entities/DatacenterBlock'

export interface ScoreState {
  score: number
  combo: number
  blocks: number
  uptime: number
}

export class ScoringSystem {
  private state: ScoreState = {
    score: 0,
    combo: 0,
    blocks: 0,
    uptime: 100,
  }

  reset() {
    this.state = {
      score: 0,
      combo: 0,
      blocks: 0,
      uptime: 100,
    }
  }

  scorePlacement(block: DatacenterBlock, previousBlock?: DatacenterBlock) {
    const anchorX = previousBlock?.x ?? WORLD.targetX
    const offset = Math.abs(block.x - anchorX)
    const quality = Phaser.Math.Clamp(1 - offset / block.blockWidth, 0, 1)
    const perfect = quality > 0.86

    this.state.blocks += 1
    this.state.combo = perfect ? this.state.combo + 1 : 0
    this.state.score += Math.round(70 + quality * 130 + this.state.combo * 35)

    return {
      perfect,
      quality,
      state: this.getState(),
    }
  }

  setUptime(uptime: number) {
    this.state.uptime = Phaser.Math.Clamp(uptime, 0, 100)
  }

  triggerOutage() {
    this.state.uptime = 0
  }

  getState(): ScoreState {
    return { ...this.state }
  }
}
