export type BlockKind = 'server' | 'cooling' | 'power' | 'network'
export type TerrainTheme = 'plain' | 'forest' | 'desert' | 'city'

export interface LevelDefinition {
  id: number
  name: string
  targetBlocks: number
  blockKinds: BlockKind[]
  terrain: TerrainTheme
}

export interface LevelCompletion {
  levelId: number
  timeMs: number
  finalUptime: number
  completedAt: string
}

export const LEVELS: LevelDefinition[] = [
  { id: 1, name: 'Edge Rack', targetBlocks: 5, blockKinds: ['server'], terrain: 'plain' },
  { id: 2, name: 'Cooling Loop', targetBlocks: 9, blockKinds: ['server', 'cooling'], terrain: 'forest' },
  { id: 3, name: 'Power Row', targetBlocks: 12, blockKinds: ['server', 'cooling', 'power'], terrain: 'desert' },
  { id: 4, name: 'Network Spine', targetBlocks: 16, blockKinds: ['server', 'cooling', 'power', 'network'], terrain: 'city' },
  { id: 5, name: 'Regional Core', targetBlocks: 20, blockKinds: ['server', 'cooling', 'power', 'network'], terrain: 'forest' },
  { id: 6, name: 'Polar Cache', targetBlocks: 23, blockKinds: ['cooling', 'server', 'network', 'power'], terrain: 'plain' },
  { id: 7, name: 'Magma Backup', targetBlocks: 26, blockKinds: ['power', 'cooling', 'server', 'network'], terrain: 'desert' },
  { id: 8, name: 'Harbor Exchange', targetBlocks: 30, blockKinds: ['network', 'server', 'cooling', 'power'], terrain: 'city' },
  { id: 9, name: 'Orbital Region', targetBlocks: 34, blockKinds: ['server', 'network', 'power', 'cooling'], terrain: 'forest' },
]

export const DEFAULT_LEVEL = LEVELS[0]

export function getLevelById(levelId: number) {
  return LEVELS.find((level) => level.id === levelId) ?? DEFAULT_LEVEL
}
