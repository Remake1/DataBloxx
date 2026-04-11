export const GAME_WIDTH = 540
export const GAME_HEIGHT = 960

export const WORLD = {
  topY: -2200,
  floorY: 890,
  floorHeight: 70,
  targetX: GAME_WIDTH / 2,
  safeTiltRadians: 0.22,
  offscreenY: GAME_HEIGHT + 160,
  cameraFollowStartLine: 340,
  cameraFollowEndLine: 590,
  cameraFollowRampBlocks: 18,
}

export const BLOCK = {
  height: 56,
  minWidth: 104,
  maxWidth: 156,
  restitution: 0,
  friction: 1,
  frictionAir: 0.038,
  density: 0.006,
}

export const CRANE = {
  y: 126,
  cableLength: 124,
  swingAmplitude: 128,
  spawnDelayMs: 520,
  releaseVelocity: 1.25,
  releaseSpin: 0.0012,
}

export const EVENTS = {
  scoreChanged: 'score-changed',
  levelChanged: 'level-changed',
  gameStatus: 'game-status',
  gameReset: 'game-reset',
  menuEntered: 'menu-entered',
} as const
