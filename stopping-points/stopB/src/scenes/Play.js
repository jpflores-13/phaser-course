import Phaser from 'phaser';

const SPEED = 200; // pixels per second
const REACH = 40; // how close you need to be to pick up a sample
const FREEZER_REACH = 90; // ...and to put it in the freezer

export class Play extends Phaser.Scene {
  constructor() {
    super('Play');
  }

  preload() {
    this.load.setPath('assets');
    this.load.spritesheet('lab', 'tiles/lab.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('researcher', 'sprites/researcher.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('freezer', 'sprites/freezer.png', { frameWidth: 64, frameHeight: 64 });
    this.load.image('tube', 'sprites/tube.png');
  }

  create() {
    const { width, height } = this.scale;
    this.add.tileSprite(0, 0, width, height, 'lab', 0).setOrigin(0, 0);

    this.freezer = this.add.image(width - 120, height / 2, 'freezer', 0).setScale(2);
    this.rack = new Phaser.Math.Vector2(140, height / 2); // where new samples appear
    this.tube = this.add.image(this.rack.x, this.rack.y, 'tube').setScale(2);
    this.player = this.add.sprite(width / 2, height / 2, 'researcher', 1).setScale(2);

    this.carrying = false;
    this.stored = 0;
    this.label = this.add.text(16, 16, 'Stored: 0', { fontFamily: 'monospace', fontSize: '24px', color: '#0f172a' });

    // arrow keys, plus WASD
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys('W,A,S,D');
  }

  update(time, delta) {
    const k = this.cursors;
    const w = this.wasd;
    const dx = (k.right.isDown || w.D.isDown ? 1 : 0) - (k.left.isDown || w.A.isDown ? 1 : 0);
    const dy = (k.down.isDown || w.S.isDown ? 1 : 0) - (k.up.isDown || w.W.isDown ? 1 : 0);

    // delta is milliseconds since the last frame, so this is the same
    // speed on a 60 Hz screen and a 144 Hz one
    const step = (SPEED * delta) / 1000;
    const length = Math.hypot(dx, dy) || 1; // don't go faster on diagonals
    this.player.x += (dx / length) * step;
    this.player.y += (dy / length) * step;

    // stay on screen
    const { width, height } = this.scale;
    this.player.x = Phaser.Math.Clamp(this.player.x, 32, width - 32);
    this.player.y = Phaser.Math.Clamp(this.player.y, 32, height - 32);

    // face the way you're walking: frame 1 down, 5 up, 9 side
    if (dx !== 0) {
      this.player.setFrame(9).setFlipX(dx < 0);
    } else if (dy !== 0) {
      this.player.setFrame(dy < 0 ? 5 : 1);
    }

    // pick up and store, by distance (lesson 4 replaces this with physics)
    const distance = (target) => Phaser.Math.Distance.Between(this.player.x, this.player.y, target.x, target.y);

    if (!this.carrying && distance(this.tube) < REACH) {
      this.carrying = true;
    }
    if (this.carrying) {
      this.tube.setPosition(this.player.x, this.player.y - 44);
      if (distance(this.freezer) < FREEZER_REACH) {
        this.carrying = false;
        this.stored += 1;
        this.label.setText(`Stored: ${this.stored}`);
        this.tube.setPosition(this.rack.x, this.rack.y);
      }
    }
  }
}
