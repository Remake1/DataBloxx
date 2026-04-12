import * as Phaser from 'phaser'
import { GAME_HEIGHT, GAME_WIDTH } from './constants'
import { BootScene } from '../scenes/BootScene'
import { GameScene } from '../scenes/GameScene'
import { MenuScene } from '../scenes/MenuScene'
import { UIScene } from '../scenes/UIScene'

export function createGame(parent: HTMLElement) {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: '#071111',
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: 'matter',
      matter: {
        gravity: { x: 0, y: 1.05 },
        positionIterations: 10,
        velocityIterations: 8,
        constraintIterations: 4,
        debug: false,
      },
    },
    scene: [BootScene, MenuScene, GameScene, UIScene],
  })
}
