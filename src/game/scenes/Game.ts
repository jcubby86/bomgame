import { Scene } from 'phaser';
import { EventBus } from '../EventBus';

export class Game extends Scene {
  private ammon: Phaser.Physics.Arcade.Sprite;
  private sheep: Phaser.Physics.Arcade.Sprite[];
  private bandits: Phaser.Physics.Arcade.Sprite[];

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

  createAmmon() {
    this.ammon = this.physics.add.sprite(512, 384, 'ammon', 6);
    this.ammon.setOrigin(0, 0);
    this.ammon.setCollideWorldBounds(true);

    this.ammon.anims.create({
      key: 'walk',
      frames: this.anims.generateFrameNumbers('ammon', {
        start: 0,
        end: 5
      }),
      frameRate: 10,
      repeat: -1
    });
    this.ammon.anims.create({
      key: 'attack',
      frames: this.anims.generateFrameNumbers('ammon', {
        start: 6,
        end: 9,
        frames: [6, 7, 8, 9, 6]
      }),
      frameRate: 10
    });
    this.ammon.anims.create({
      key: 'die',
      frames: this.anims.generateFrameNumbers('ammon', {
        start: 10,
        end: 14
      }),
      frameRate: 10
    });

    const spaceBar = this.input.keyboard?.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE
    );

    spaceBar?.on('down', () => {
      console.log("Spacebar pressed");
      this.ammon.play('attack');
    });
  }

  create() {
    this.add.image(0, 0, 'background').setOrigin(0, 0);
    this.createAmmon();
    
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
      frames: this.anims.generateFrameNumbers('bandit', {
        start: 6,
        end: 9,
        frames: [6, 7, 8, 9, 6]
      }),
      frameRate: 10
    });
    this.anims.create({
      key: 'bandit-run',
      frames: this.anims.generateFrameNumbers('bandit', { start: 10, end: 15 }),
      frameRate: 10,
      repeat: -1
    });

    EventBus.emit('current-scene-ready', this);
  }

  update() {
    const cursors = this.input.keyboard?.createCursorKeys();

    cursors?.left.on('down', () => {
      this.ammon.play('walk', true);
      
    });

    let movingX = false, movingY = false;

    if (cursors?.left.isDown) {
      this.ammon.setVelocityX(-200);
      this.ammon.flipX = true;
      movingX = true;
    } else if (cursors?.right.isDown) {
      this.ammon.setVelocityX(200);
      this.ammon.flipX = false;
      movingX = true;
    }
    if (cursors?.up.isDown) {
      this.ammon.setVelocityY(-200);
      movingY = true;
    } else if (cursors?.down.isDown) {
      this.ammon.setVelocityY(200);
      movingY = true;
    }

    if (!movingX && !movingY) {
      this.ammon.setVelocity(0, 0);
      this.ammon.stop();
      this.ammon.setFrame(6);
    } else if (!movingX) {
      this.ammon.setVelocityX(0);
      this.ammon.play('walk', true);
    } else if (!movingY) {
      this.ammon.setVelocityY(0);
      this.ammon.play('walk', true);
    }
  }
}
