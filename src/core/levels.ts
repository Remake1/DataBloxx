export type BlockKind = 'server' | 'cooling' | 'power' | 'network'

export interface LevelDefinition {
  id: number
  name: string
  targetBlocks: number
  blockKinds: BlockKind[]
}

export interface LevelCompletion {
  levelId: number
  timeMs: number
  finalUptime: number
  completedAt: string
}

export const LEVELS: LevelDefinition[] = [
  { id: 1, name: 'Edge Rack', targetBlocks: 5, blockKinds: ['server'] },
  { id: 2, name: 'Cooling Loop', targetBlocks: 9, blockKinds: ['server', 'cooling'] },
  { id: 3, name: 'Power Row', targetBlocks: 12, blockKinds: ['server', 'cooling', 'power'] },
  { id: 4, name: 'Network Spine', targetBlocks: 16, blockKinds: ['server', 'cooling', 'power', 'network'] },
  { id: 5, name: 'Regional Core', targetBlocks: 20, blockKinds: ['server', 'cooling', 'power', 'network'] },
]

export const DEFAULT_LEVEL = LEVELS[0]

export function getLevelById(levelId: number) {
  return LEVELS.find((level) => level.id === levelId) ?? DEFAULT_LEVEL
}
