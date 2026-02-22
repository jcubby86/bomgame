import { Scene } from 'phaser';
import { EventBus } from '../EventBus';
import { WIDTH, HEIGHT } from '../StartGame';

const SHEEP_SPEED = 120;
const BANDIT_SPEED = 150;
const PLAYER_SPEED = 200;

const SHEEP_COUNT = 5;
const BANDIT_COUNT = 5;

const ATTACK_RANGE = 50;

const SPRITE_SIZE = 160;
const SPRITE_OFFSET_X = 10;
const ARM_OFFSET = 15;

function originY() {
  return SPRITE_SIZE / 2;
}

function originX(flipX: boolean) {
  return SPRITE_SIZE / 2 + (flipX ? SPRITE_OFFSET_X : -SPRITE_OFFSET_X);
}

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
      frameWidth: SPRITE_SIZE,
      frameHeight: SPRITE_SIZE,
      startFrame: 0,
      endFrame: 14
    });
    this.load.spritesheet('sheep', 'sheep.png', {
      frameWidth: SPRITE_SIZE,
      frameHeight: SPRITE_SIZE,
      startFrame: 0,
      endFrame: 1
    });
    this.load.spritesheet('bandit', 'bandit.png', {
      frameWidth: SPRITE_SIZE,
      frameHeight: SPRITE_SIZE,
      startFrame: 0,
      endFrame: 15
    });
    this.load.image('arm', 'arm.png');
  }

  checkAttack(
    attacker: Phaser.Physics.Arcade.Sprite,
    defender: Phaser.Physics.Arcade.Sprite = this.player
  ) {
    if (attacker.flipX) {
      return (
        attacker.x - ATTACK_RANGE < defender.x &&
        attacker.x > defender.x &&
        Math.abs(attacker.y - defender.y) < ATTACK_RANGE
      );
    } else {
      return (
        attacker.x + ATTACK_RANGE > defender.x &&
        attacker.x < defender.x &&
        Math.abs(attacker.y - defender.y) < ATTACK_RANGE
      );
    }
  }

  gameLost() {
    this.state = 'lose';
    this.player.play('die', true);
    this.bandits.forEach((bandit) => {
      if (bandit.anims.currentAnim?.key === 'bandit-run') return;
      bandit.setVelocity(BANDIT_SPEED, 0);
      bandit.setFlipX(false);
      bandit.setDisplayOrigin(originX(false), originY());
    });
    this.updateText('You Lose!');
  }

  gameWon() {
    this.state = 'win';
    this.sheep.forEach((sheep) => {
      sheep.setVelocity(-SHEEP_SPEED, 0);
      sheep.setFlipX(true);
      sheep.setX(WIDTH + between(SPRITE_SIZE / 2, WIDTH));
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
        .text(WIDTH / 2, HEIGHT / 2, message, {
          fontSize: WIDTH < 500 ? '24px' : '48px',
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
      bandit.x + (bandit.flipX ? -ARM_OFFSET : ARM_OFFSET),
      bandit.y + ARM_OFFSET,
      'arm'
    );
    arm.setFlipX(bandit.flipX);
    arm.setDepth(arm.y);

    const index = this.arms.push(arm) - 1;
    this.armTargets.set(index, arm.y + SPRITE_SIZE / 2);

    arm.setVelocity(between(-5, 5), between(-200, -100));
    arm.setAngularVelocity(between(-200, 200));
    arm.setAccelerationY(1000);
  }

  killBandit(bandit: Phaser.Physics.Arcade.Sprite) {
    this.createArm(bandit);

    bandit.play('bandit-run');
    bandit.setVelocity(-(BANDIT_SPEED * 1.5), 0);
    bandit.setFlipX(true);
    bandit.setDisplayOrigin(originX(false), originY());

    this.banditsKilled += 1;
    if (this.banditsKilled >= this.bandits.length) {
      this.gameWon();
    }
  }

  attack() {
    if (
      this.state === 'lose' ||
      this.player.anims.currentAnim?.key === 'attack'
    )
      return;
    this.player.play('attack');
  }

  createPlayer() {
    this.player = this.physics.add.sprite(WIDTH / 2, HEIGHT / 2, 'ammon', 6);
    this.player.setOrigin(0.5, 0.5);
    this.player.setCollideWorldBounds(true);
    this.player.setInteractive();

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
      this.attack();
    });

    this.player.on('pointerdown', () => {
      this.attack();
    });

    this.player.on('animationcomplete-attack', () => {
      this.bandits.forEach((bandit) => {
        if (this.checkAttack(this.player, bandit)) {
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
    for (let i = 0; i < SHEEP_COUNT; i++) {
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
    for (let i = 0; i < BANDIT_COUNT; i++) {
      const x = randomValue([
        -(SPRITE_SIZE / 2) - (i * WIDTH) / 2,
        SPRITE_SIZE / 2 + WIDTH + (i * WIDTH) / 2
      ]);
      const y = randomValue([
        -(SPRITE_SIZE / 2) - (i * HEIGHT) / 2,
        SPRITE_SIZE / 2 + HEIGHT + (i * HEIGHT) / 2
      ]);

      const bandit = this.physics.add.sprite(x, y, 'bandit');

      bandit.on('animationcomplete-bandit-attack', () => {
        if (this.checkAttack(bandit) && this.state === 'play') {
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

    let moveX = 0;
    let moveY = 0;

    // Keyboard controls
    if (this.cursors?.left.isDown) {
      moveX = -1;
    } else if (this.cursors?.right.isDown) {
      moveX = 1;
    }

    if (this.cursors?.up.isDown) {
      moveY = -1;
    } else if (this.cursors?.down.isDown) {
      moveY = 1;
    }

    // Touch controls - move toward touch position
    if (this.input.activePointer?.isDown) {
      const touchX = this.input.activePointer.x;
      const touchY = this.input.activePointer.y;
      const dx = touchX - this.player.x;
      const dy = touchY - this.player.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Only move if touch is far enough away (dead zone)
      if (distance > 50) {
        moveX = dx;
        moveY = dy;
      }
    }

    // Apply movement
    if (moveX !== 0) {
      this.player.setVelocityX(moveX);
      if (moveX < 0) {
        this.player.setFlipX(true);
        this.player.setDisplayOrigin(originX(true), originY());
      } else {
        this.player.setFlipX(false);
        this.player.setDisplayOrigin(originX(false), originY());
      }
    }

    if (moveY !== 0) {
      this.player.setVelocityY(moveY);
    }

    this.player.body?.velocity.normalize().scale(PLAYER_SPEED);

    if (moveX !== 0 || moveY !== 0) {
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

      if (this.sheep.every((sheep) => sheep.x >= WIDTH + SPRITE_SIZE / 2)) {
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

      if (this.checkAttack(bandit)) {
        bandit.play('bandit-attack', true);
        bandit.setVelocity(0);
        return;
      }

      bandit.setVelocity(this.player.x - bandit.x, this.player.y - bandit.y);
      bandit.body?.velocity.normalize().scale(BANDIT_SPEED);
      bandit.play('bandit-walk', true);

      if (this.player.x < bandit.x) {
        bandit.setFlipX(true);
        bandit.setDisplayOrigin(originX(true), originY());
      } else {
        bandit.setFlipX(false);
        bandit.setDisplayOrigin(originX(false), originY());
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
