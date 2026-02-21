import { Scene } from 'phaser';
import { EventBus } from '../EventBus';

export class Game extends Scene {
  private player: Phaser.Physics.Arcade.Sprite;
  private playerDead = false;
  private sheep: Phaser.Physics.Arcade.Sprite[];
  private bandits: Phaser.Physics.Arcade.Sprite[];
  private banditsKilled = 0;
  private arms: Phaser.Physics.Arcade.Sprite[] = [];
  private armTargets: Map<number, { y: number }> = new Map();
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;

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

  checkBanditPlayerCollision(bandit: Phaser.Physics.Arcade.Sprite, limit = 60) {
    return (
      Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        bandit.x,
        bandit.y
      ) <= limit
    );
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
      if (this.playerDead) return;
      this.player.play('attack');
    });

    this.player.on('animationcomplete-attack', () => {
      this.bandits.forEach((bandit) => {
        if (this.checkBanditPlayerCollision(bandit)) {
          const arm = this.physics.add.sprite(
            bandit.x + 15,
            bandit.y + 15,
            'arm'
          );
          arm.setFlipX(bandit.flipX);
          if (arm.flipX) {
            arm.setX(arm.x - 30);
          }
          arm.setDepth(arm.y);

          const index = this.arms.push(arm) - 1;
          this.armTargets.set(index, { y: arm.y + 95 });

          arm.setVelocityY(Phaser.Math.Between(-200, -100));
          arm.setAngularVelocity(Phaser.Math.Between(-200, 200));
          arm.setAccelerationY(500);

          bandit.play('bandit-run');
          bandit.setVelocity(-200, 0);
          bandit.setFlipX(true);
          bandit.setDisplayOrigin(90, 80);
          this.banditsKilled += 1;
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
    for (let i = 0; i < 1; i++) {
      const bandit = this.physics.add.sprite(
        Phaser.Math.Between(100, 900),
        Phaser.Math.Between(100, 700),
        'bandit'
      );

      bandit.on('animationcomplete-bandit-attack', () => {
        if (this.checkBanditPlayerCollision(bandit) && !this.playerDead) {
          this.playerDead = true;
          this.player.play('die', true);
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
    const speed = 200;

    this.player.setVelocity(0);

    if (['attack', 'die'].includes(this.player.anims.currentAnim?.key || '')) {
      return;
    }

    if (this.cursors?.left.isDown) {
      this.player.setVelocityX(-speed);
      this.player.setFlipX(true);
      this.player.setDisplayOrigin(90, 80);
    } else if (this.cursors?.right.isDown) {
      this.player.setVelocityX(speed);
      this.player.setFlipX(false);
      this.player.setDisplayOrigin(70, 80);
    }

    if (this.cursors?.up.isDown) {
      this.player.setVelocityY(-speed);
    } else if (this.cursors?.down.isDown) {
      this.player.setVelocityY(speed);
    }

    this.player.body?.velocity.normalize().scale(speed);

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
    this.sheep.forEach((sheep) => {
      if (this.banditsKilled === this.bandits.length) {
        sheep.setVelocityX(-120);
        sheep.setFlipX(true);
      } else if (Phaser.Math.Between(0, 100) < 1) {
        sheep.setVelocityY(-1 * sheep.body!.velocity.y);
      }
    });
  }

  updateBandits() {
    this.bandits.forEach((bandit) => {
      const speed = 120;

      if (
        ['bandit-attack', 'bandit-run'].includes(
          bandit.anims.currentAnim?.key || ''
        )
      ) {
        return;
      }

      if (this.playerDead) {
        bandit.play('bandit-walk', true);
        bandit.setVelocity(speed, 0);
        bandit.setFlipX(false);
        bandit.setDisplayOrigin(70, 80);
        return;
      }

      if (this.checkBanditPlayerCollision(bandit, speed / 2)) {
        bandit.play('bandit-attack', true);
        bandit.setVelocity(0);
        return;
      }

      if (this.player.x < bandit.x - speed / 2) {
        bandit.setVelocityX(-speed);
        bandit.setFlipX(true);
        bandit.setDisplayOrigin(90, 80);
      } else if (this.player.x > bandit.x + speed / 2) {
        bandit.setVelocityX(speed);
        bandit.setFlipX(false);
        bandit.setDisplayOrigin(70, 80);
      }

      if (this.player.y < bandit.y - speed / 2) {
        bandit.setVelocityY(-speed);
      } else if (this.player.y > bandit.y + speed / 2) {
        bandit.setVelocityY(speed);
      }

      bandit.body?.velocity.normalize().scale(speed);
      bandit.play('bandit-walk', true);
    });
  }

  updateArms() {
    this.arms.forEach((arm, index) => {
      const target = this.armTargets.get(index);
      if (!target) return;

      // Check if arm has reached or passed the target Y position
      if (arm.y >= target.y) {
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
