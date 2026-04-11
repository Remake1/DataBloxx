import { reactive } from 'vue'
import { EVENTS } from '../core/constants'
import { gameEvents } from '../core/events'
import type { LevelDefinition } from '../core/levels'
import type { ScoreState } from '../systems/ScoringSystem'

export const hudState = reactive<ScoreState & { levelId: number; targetBlocks: number; message: string }>({
  score: 0,
  combo: 0,
  blocks: 0,
  levelId: 1,
  targetBlocks: 5,
  uptime: 100,
  message: 'Tap to start deploying datacenter modules.',
})

gameEvents.on(EVENTS.scoreChanged, (state: ScoreState) => {
  hudState.score = state.score
  hudState.combo = state.combo
  hudState.blocks = state.blocks
  hudState.uptime = state.uptime
})

gameEvents.on(EVENTS.gameStatus, (message: string) => {
  hudState.message = message
})

gameEvents.on(EVENTS.levelChanged, (level: LevelDefinition) => {
  hudState.levelId = level.id
  hudState.targetBlocks = level.targetBlocks
})

gameEvents.on(EVENTS.gameReset, () => {
  hudState.score = 0
  hudState.combo = 0
  hudState.blocks = 0
  hudState.uptime = 100
})
