import { Scene } from 'phaser';
import { EventBus } from '../EventBus';
import { WIDTH, HEIGHT } from '../StartGame';

const SHEEP_SPEED = 120;
const BANDIT_SPEED = 150;
const PLAYER_SPEED = 200;

function between(min: number, max: number) {
  return Phaser.Math.Between(min, max);
}

function randomValue<T>(options: T[]): T {
  return options[between(0, options.length - 1)];
}

export class Game extends Scene {
  private player: Phaser.Physics.Arcade.Sprite;
  private sheep: Phaser.Physics.Arcade.Sprite[];
  private bandits: Phaser.Physics.Arcade.Sprite[];
  private banditsKilled = 0;
  private arms: Phaser.Physics.Arcade.Sprite[] = [];
  private armTargets: Map<number, number> = new Map();
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private state: 'play' | 'win' | 'lose' | 'start' = 'start';
  private text: Phaser.GameObjects.Text;

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
      BANDIT_SPEED / 2
    );
  }

  gameLost() {
    this.state = 'lose';
    this.player.play('die', true);
    this.bandits.forEach((bandit) => {
      if (bandit.anims.currentAnim?.key === 'bandit-run') return;
      bandit.setVelocity(BANDIT_SPEED, 0);
      bandit.setFlipX(false);
      bandit.setDisplayOrigin(70, 80);
    });
    this.updateText('You Lose!');
  }

  gameWon() {
    this.state = 'win';
    this.sheep.forEach((sheep) => {
      sheep.setVelocity(-SHEEP_SPEED, 0);
      sheep.setFlipX(true);
      sheep.setX(WIDTH + between(0, WIDTH));
      sheep.setY(between(0, HEIGHT));
    });
    this.updateText('You Win!');
  }

  updateText(message?: string) {
    if (this.text) {
      this.text.destroy();
    }

    if (message) {
      this.text = this.add
        .text(512, 384, message, {
          fontSize: '48px',
          fontStyle: 'bold',
          fontFamily: 'Arial',
          color: '#fff',
          padding: { x: 20, y: 10 },
          align: 'center'
        })
        .setOrigin(0.5)
        .setDepth(1000);
    }
  }

  createArm(bandit: Phaser.Physics.Arcade.Sprite) {
    const arm = this.physics.add.sprite(
      bandit.x + (bandit.flipX ? -15 : 15),
      bandit.y + 15,
      'arm'
    );
    arm.setFlipX(bandit.flipX);
    arm.setDepth(arm.y);

    const index = this.arms.push(arm) - 1;
    this.armTargets.set(index, arm.y + 80);

    arm.setVelocity(between(-5, 5), between(-200, -100));
    arm.setAngularVelocity(between(-200, 200));
    arm.setAccelerationY(1000);
  }

  killBandit(bandit: Phaser.Physics.Arcade.Sprite) {
    this.createArm(bandit);

    bandit.play('bandit-run');
    bandit.setVelocity(-(BANDIT_SPEED * 1.5), 0);
    bandit.setFlipX(true);
    bandit.setDisplayOrigin(90, 80);

    this.banditsKilled += 1;
    if (this.banditsKilled >= this.bandits.length) {
      this.gameWon();
    }
  }

  createPlayer() {
    this.player = this.physics.add.sprite(WIDTH / 2, HEIGHT / 2, 'ammon', 6);
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
        frames: [6, 7, 7, 8, 8, 9, 6]
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
        between(0, WIDTH),
        between(0, HEIGHT),
        'sheep'
      );
      sheep.play('sheep-run');
      sheep.setVelocity(2, randomValue([-1, 1]));
      sheep.body?.velocity.normalize().scale(SHEEP_SPEED * 1.5);
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
        frames: [6, 6, 6, 6, 6, 7, 7, 8, 8, 9, 6]
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
      const x = randomValue([
        -100 - (i * WIDTH) / 2,
        100 + WIDTH + (i * WIDTH) / 2
      ]);
      const y = randomValue([
        -100 - (i * HEIGHT) / 2,
        100 + HEIGHT + (i * HEIGHT) / 2
      ]);

      const bandit = this.physics.add.sprite(x, y, 'bandit');

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
    const bg = this.add.image(0, 0, 'background').setOrigin(0, 0);
    bg.setDepth(-HEIGHT);
    this.createPlayer();
    this.createSheep();
    this.createBandits();

    this.updateText('Defend the Sheep!');

    EventBus.emit('current-scene-ready', this);
  }

  updatePlayer() {
    this.player.setVelocity(0);

    if (['attack', 'die'].includes(this.player.anims.currentAnim?.key || '')) {
      return;
    }

    if (this.cursors?.left.isDown) {
      this.player.setVelocityX(-1);
      this.player.setFlipX(true);
      this.player.setDisplayOrigin(90, 80);
    } else if (this.cursors?.right.isDown) {
      this.player.setVelocityX(1);
      this.player.setFlipX(false);
      this.player.setDisplayOrigin(70, 80);
    }

    if (this.cursors?.up.isDown) {
      this.player.setVelocityY(-1);
    } else if (this.cursors?.down.isDown) {
      this.player.setVelocityY(1);
    }

    this.player.body?.velocity.normalize().scale(PLAYER_SPEED);

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
        if (between(0, 100) < 1) {
          sheep.setVelocityY(-1 * sheep.body!.velocity.y);
        }
      });

      if (this.sheep.every((sheep) => sheep.x >= WIDTH + 100)) {
        this.state = 'play';
        this.updateText();
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

      bandit.setVelocity(this.player.x - bandit.x, this.player.y - bandit.y);
      bandit.body?.velocity.normalize().scale(BANDIT_SPEED);
      bandit.play('bandit-walk', true);

      if (this.player.x < bandit.x) {
        bandit.setFlipX(true);
        bandit.setDisplayOrigin(90, 80);
      } else {
        bandit.setFlipX(false);
        bandit.setDisplayOrigin(70, 80);
      }
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
