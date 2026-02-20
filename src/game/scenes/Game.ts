import { Scene } from 'phaser';
import { EventBus } from '../EventBus';

export class Game extends Scene {
  constructor() {
    super('Game');
  }

  preload() {
    this.load.setPath('assets');

    this.load.image('background', 'grass.png');
    this.load.spritesheet('ammon', 'ammon.png', {
      frameWidth: 160,
      frameHeight: 160,
      startFrame: 0,
      endFrame: 14
    });
    this.load.spritesheet('sheep', 'sheep.png', {
      frameWidth: 160,
      frameHeight: 160,
      startFrame: 0,
      endFrame: 1
    });
    this.load.spritesheet('bandit', 'bandit.png', {
      frameWidth: 160,
      frameHeight: 160,
      startFrame: 0,
      endFrame: 15
    });
    this.load.image('arm', 'arm.png');
  }

  create() {
    this.add.image(512, 384, 'background');
    this.add.sprite(512, 384, 'ammon', 14);
    this.add.sprite(300, 300, 'sheep', 1);
    this.add.sprite(700, 300, 'bandit', 15);

    EventBus.emit('current-scene-ready', this);
  }

  update() {}
}
