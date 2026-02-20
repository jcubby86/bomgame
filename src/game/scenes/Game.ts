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
    const ammon = this.add.sprite(512, 384, 'ammon', 14);
    const sheep = this.add.sprite(300, 300, 'sheep', 1);
    const bandit = this.add.sprite(700, 300, 'bandit', 15);

    ammon.anims.create({
      key: 'walk',
      frames: ammon.anims.generateFrameNumbers('ammon', { start: 0, end: 5 }),
      frameRate: 10,
      repeat: -1
    });
    ammon.anims.create({
      key: 'stand',
      frames: ammon.anims.generateFrameNumbers('ammon', { start: 6, end: 6 }),
      frameRate: 10
    });
    ammon.anims.create({
      key: 'attack',
      frames: ammon.anims.generateFrameNumbers('ammon', { start: 7, end: 9 }),
      frameRate: 10
    });
    ammon.anims.create({
      key: 'die',
      frames: ammon.anims.generateFrameNumbers('ammon', { start: 10, end: 14 }),
      frameRate: 10
    });

    this.anims.create({
      key: 'sheep-walk',
      frames: this.anims.generateFrameNumbers('sheep', { start: 0, end: 1 }),
      frameRate: 10,
      repeat: -1
    });

    this.anims.create({
      key: 'bandit-walk',
      frames: this.anims.generateFrameNumbers('bandit', { start: 0, end: 5 }),
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: 'bandit-attack',
      frames: this.anims.generateFrameNumbers('bandit', { start: 7, end: 9 }),
      frameRate: 10
    });
    this.anims.create({
      key: 'bandit-run',
      frames: this.anims.generateFrameNumbers('bandit', { start: 10, end: 15 }),
      frameRate: 10,
      repeat: -1
    });

    bandit.play('bandit-walk');
    sheep.play('sheep-walk');
    ammon.play('walk');


    EventBus.emit('current-scene-ready', this);
  }

  update() {}
}
