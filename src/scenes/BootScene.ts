import * as Phaser from 'phaser'
import { createGeneratedAssets } from '../core/assets'

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene')
  }

  create() {
    createGeneratedAssets(this)
    this.scene.start('MenuScene')
    this.scene.launch('UIScene')
  }
}
