export const GAME_WIDTH = 540;
export const GAME_HEIGHT = 960;

export const WORLD = {
  topY: -2200,
  floorY: 930,
  floorHeight: 70,
  targetX: GAME_WIDTH / 2,
  safeTiltRadians: 0.22,
  offscreenY: GAME_HEIGHT + 160,
  cameraFollowStartLine: 620,
  cameraFollowEndLine: 820,
  cameraFollowRampBlocks: 18,
};

export const BLOCK = {
  height: 56,
  minWidth: 104,
  maxWidth: 156,
  floorTouchTolerance: 3,
  restitution: 0,
  friction: 1.4,
  frictionStatic: 2.2,
  frictionAir: 0.065,
  density: 0.008,
};

export const CRANE = {
  y: 126,
  cableLength: 124,
  swingAmplitude: 128,
  minArcHeight: 18,
  maxArcHeight: 50,
  arcRampStartBlocks: 2,
  arcRampBlocks: 12,
  previewRotationAmplitude: 0.11,
  previewSpinAmplitude: 0.012,
  spawnDelayMs: 520,
  releaseVelocity: 1.25,
  releaseDropVelocity: 2.0,
  releaseSpin: 0.002,
};

export const EVENTS = {
  scoreChanged: "score-changed",
  levelChanged: "level-changed",
  gameStatus: "game-status",
  gameReset: "game-reset",
  menuEntered: "menu-entered",
} as const;
