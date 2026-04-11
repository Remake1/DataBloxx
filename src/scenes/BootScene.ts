import * as Phaser from 'phaser'
import { AssetKeys, createGeneratedAssets } from '../core/assets'

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene')
  }

  preload() {
    this.load.audio(
      AssetKeys.levelComplete,
      new URL('../audio/level_complete.mp3', import.meta.url).href,
    )
    this.load.audio(
      AssetKeys.connected,
      new URL('../audio/connected.mp3', import.meta.url).href,
    )
    this.load.audio(
      AssetKeys.levelFailed,
      new URL('../audio/level_failed.mp3', import.meta.url).href,
    )
    this.load.audio(
      AssetKeys.fallImpact,
      new URL('../audio/fall_impact.mp3', import.meta.url).href,
    )
  }

  create() {
    createGeneratedAssets(this)
    this.scene.start('MenuScene')
    this.scene.launch('UIScene')
  }
}
