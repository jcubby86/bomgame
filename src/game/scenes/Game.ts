import { Scene } from 'phaser';
import { EventBus } from '../EventBus';

const WALK_SPEED = 120;
const RUN_SPEED = 200;

export class Game extends Scene {
  private player: Phaser.Physics.Arcade.Sprite;
  private sheep: Phaser.Physics.Arcade.Sprite[];
  private bandits: Phaser.Physics.Arcade.Sprite[];
  private banditsKilled = 0;
  private arms: Phaser.Physics.Arcade.Sprite[] = [];
  private armTargets: Map<number, number> = new Map();
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private state: 'play' | 'win' | 'lose' | 'start' = 'start';

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

  checkBanditPlayerCollision(bandit: Phaser.Physics.Arcade.Sprite) {
    return (
      Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        bandit.x,
        bandit.y
      ) <=
      WALK_SPEED / 2
    );
  }

  gameLost() {
    this.state = 'lose';
    this.player.play('die', true);
    this.bandits.forEach((bandit) => {
      if (bandit.anims.currentAnim?.key === 'bandit-run') return;
      bandit.setVelocity(WALK_SPEED, 0);
      bandit.setFlipX(false);
      bandit.setDisplayOrigin(70, 80);
    });
  }

  gameWon() {
    this.state = 'win';
    this.sheep.forEach((sheep) => {
      sheep.setVelocity(-WALK_SPEED, 0);
      sheep.setFlipX(true);
      if (sheep.x >= 1100) {
        sheep.setX(1024 + Phaser.Math.Between(50, 200));
      }
      sheep.setY(Phaser.Math.Between(100, 700));
    });
  }

  createArm(bandit: Phaser.Physics.Arcade.Sprite) {
    const arm = this.physics.add.sprite(bandit.x + 15, bandit.y + 15, 'arm');
    arm.setFlipX(bandit.flipX);
    if (arm.flipX) {
      arm.setX(arm.x - 30);
    }
    arm.setDepth(arm.y);

    const index = this.arms.push(arm) - 1;
    this.armTargets.set(index, arm.y + 80);

    arm.setVelocityY(Phaser.Math.Between(-200, -100));
    arm.setAngularVelocity(Phaser.Math.Between(-200, 200));
    arm.setAccelerationY(1000);
  }

  killBandit(bandit: Phaser.Physics.Arcade.Sprite) {
    this.createArm(bandit);

    bandit.play('bandit-run');
    bandit.setVelocity(-RUN_SPEED, 0);
    bandit.setFlipX(true);
    bandit.setDisplayOrigin(90, 80);

    this.banditsKilled += 1;
    if (this.banditsKilled >= this.bandits.length) {
      this.gameWon();
    }
  }

  createPlayer() {
    this.player = this.physics.add.sprite(512, 384, 'ammon', 6);
    this.player.setOrigin(0.5, 0.5);
    this.player.setCollideWorldBounds(true);

    this.player.anims.create({
      key: 'walk',
      frames: this.anims.generateFrameNumbers('ammon', {
        start: 0,
        end: 5
      }),
      frameRate: 10,
      repeat: -1
    });
    this.player.anims.create({
      key: 'attack',
      frames: this.anims.generateFrameNumbers('ammon', {
        start: 6,
        end: 9,
        frames: [6, 7, 8, 9, 6]
      }),
      frameRate: 10
    });
    this.player.anims.create({
      key: 'die',
      frames: this.anims.generateFrameNumbers('ammon', {
        start: 10,
        end: 14
      }),
      frameRate: 10
    });

    this.cursors?.space?.on('down', () => {
      if (this.state !== 'play') return;
      this.player.play('attack');
    });

    this.player.on('animationcomplete-attack', () => {
      this.bandits.forEach((bandit) => {
        if (this.checkBanditPlayerCollision(bandit)) {
          this.killBandit(bandit);
        }
      });

      this.player.play('walk');
    });
  }

  createSheep() {
    this.anims.create({
      key: 'sheep-run',
      frames: this.anims.generateFrameNumbers('sheep', { start: 0, end: 1 }),
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: 'sheep-walk',
      frames: this.anims.generateFrameNumbers('sheep', { start: 0, end: 1 }),
      frameRate: 20,
      repeat: -1
    });

    this.sheep = [];
    for (let i = 0; i < 5; i++) {
      const sheep = this.physics.add.sprite(
        Phaser.Math.Between(100, 900),
        Phaser.Math.Between(100, 700),
        'sheep'
      );
      sheep.play('sheep-run');
      sheep.setVelocityX(200);
      sheep.setVelocityY(Phaser.Math.Between(-50, 50));
      this.sheep.push(sheep);
    }
  }

  createBandits() {
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

    this.bandits = [];
    for (let i = 0; i < 3; i++) {
      const bandit = this.physics.add.sprite(
        Phaser.Math.Between(-1000, 2000),
        Phaser.Math.Between(-1000, 2000),
        'bandit'
      );

      bandit.on('animationcomplete-bandit-attack', () => {
        if (this.checkBanditPlayerCollision(bandit) && this.state === 'play') {
          this.gameLost();
        }
        bandit.play('bandit-walk');
      });

      this.bandits.push(bandit);
    }
  }

  create() {
    this.physics.world.defaults.debugShowBody = true;
    this.cursors = this.input.keyboard?.createCursorKeys();
    this.add.image(0, 0, 'background').setOrigin(0, 0);
    this.createPlayer();
    this.createSheep();
    this.createBandits();

    EventBus.emit('current-scene-ready', this);
  }

  updatePlayer() {
    this.player.setVelocity(0);

    if (['attack', 'die'].includes(this.player.anims.currentAnim?.key || '')) {
      return;
    }

    if (this.cursors?.left.isDown) {
      this.player.setVelocityX(-RUN_SPEED);
      this.player.setFlipX(true);
      this.player.setDisplayOrigin(90, 80);
    } else if (this.cursors?.right.isDown) {
      this.player.setVelocityX(RUN_SPEED);
      this.player.setFlipX(false);
      this.player.setDisplayOrigin(70, 80);
    }

    if (this.cursors?.up.isDown) {
      this.player.setVelocityY(-RUN_SPEED);
    } else if (this.cursors?.down.isDown) {
      this.player.setVelocityY(RUN_SPEED);
    }

    this.player.body?.velocity.normalize().scale(RUN_SPEED);

    const velocityX = this.player.body?.velocity.x || 0;
    const velocityY = this.player.body?.velocity.y || 0;

    if (velocityX !== 0 || velocityY !== 0) {
      this.player.play('walk', true);
    } else if (this.player.anims.currentAnim?.key === 'walk') {
      this.player.stop();
      this.player.setFrame(6);
    }
  }

  updateSheep() {
    if (this.state === 'start') {
      this.sheep.forEach((sheep) => {
        if (Phaser.Math.Between(0, 100) < 1) {
          sheep.setVelocityY(-1 * sheep.body!.velocity.y);
        }
      });

      if (this.sheep.every((sheep) => sheep.x >= 1100)) {
        this.state = 'play';
      }
    }
  }

  updateBandits() {
    this.bandits.forEach((bandit) => {
      if (
        ['bandit-attack', 'bandit-run'].includes(
          bandit.anims.currentAnim?.key || ''
        ) ||
        this.state !== 'play'
      ) {
        return;
      }

      if (this.checkBanditPlayerCollision(bandit)) {
        bandit.play('bandit-attack', true);
        bandit.setVelocity(0);
        return;
      }

      if (this.player.x < bandit.x - WALK_SPEED / 2) {
        bandit.setVelocityX(-WALK_SPEED);
        bandit.setFlipX(true);
        bandit.setDisplayOrigin(90, 80);
      } else if (this.player.x > bandit.x + WALK_SPEED / 2) {
        bandit.setVelocityX(WALK_SPEED);
        bandit.setFlipX(false);
        bandit.setDisplayOrigin(70, 80);
      }

      if (this.player.y < bandit.y - WALK_SPEED / 2) {
        bandit.setVelocityY(-WALK_SPEED);
      } else if (this.player.y > bandit.y + WALK_SPEED / 2) {
        bandit.setVelocityY(WALK_SPEED);
      }

      bandit.body?.velocity.normalize().scale(WALK_SPEED);
      bandit.play('bandit-walk', true);
    });
  }

  updateArms() {
    this.arms.forEach((arm, index) => {
      const target = this.armTargets.get(index);
      if (!target) return;

      // Check if arm has reached or passed the target Y position
      if (arm.y >= target) {
        arm.setVelocity(0, 0);
        arm.setAcceleration(0, 0);
        arm.setAngularVelocity(0);
      }
    });
  }

  update() {
    this.updatePlayer();
    this.updateSheep();
    this.updateBandits();
    this.updateArms();

    // Sort sprites by Y position for depth
    this.player.setDepth(this.player.y);
    this.sheep.forEach((sheep) => sheep.setDepth(sheep.y));
    this.bandits.forEach((bandit) => bandit.setDepth(bandit.y));
  }
}
