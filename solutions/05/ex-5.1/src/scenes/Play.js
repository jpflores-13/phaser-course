import Phaser from 'phaser';
import { Researcher } from '../objects/Researcher.js';

// One screen of lab, 30 x 17 tiles of 32 px. # is a wall, B is a bench.
// (Lesson 6 replaces this with a map drawn in Tiled.)
const LAYOUT = [
  '##############################',
  '#............................#',
  '#..BBBBBB.........BBBBBB.....#',
  '#............................#',
  '#............................#',
  '#..BBBBBB...........#........#',
  '#...................#........#',
  '#...................#........#',
  '#............................#',
  '#............................#',
  '#...................#........#',
  '#..BBBBBB...........#........#',
  '#............................#',
  '#............................#',
  '#..BBBBBB.........BBBBBB.....#',
  '#............................#',
  '##############################',
];
const TILE = 32;
const at = (col) => col * TILE + TILE / 2; // the centre of a tile, in pixels

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
    this.load.image('cart', 'sprites/cart.png');
    this.load.audio('pickup', 'audio/pickup.wav');
    this.load.audio('deliver', 'audio/deliver.wav');
    this.load.audio('bump', 'audio/bump.wav');
  }

  create() {
    const { width, height } = this.scale;
    this.add.tileSprite(0, 0, width, height, 'lab', 0).setOrigin(0, 0);

    // ---- animations: frames 0-3 walk down, 4-7 up, 8-11 sideways ----
    for (const [key, start] of [['walk-down', 0], ['walk-up', 4], ['walk-side', 8]]) {
      this.anims.create({
        key,
        frames: this.anims.generateFrameNumbers('researcher', { start, end: start + 3 }),
        frameRate: 10,
        repeat: -1,
      });
    }

    // new: door open (frame 1) for half a second, then shut (frame 0)
    this.anims.create({
      key: 'freezer-open',
      frames: this.anims.generateFrameNumbers('freezer', { frames: [1, 0] }),
      frameRate: 2,
    });

    // ---- walls and benches: static bodies never move ----
    this.walls = this.physics.add.staticGroup();
    LAYOUT.forEach((row, y) => {
      [...row].forEach((cell, x) => {
        if (cell === '#') this.walls.create(at(x), at(y), 'lab', 2);
        if (cell === 'B') this.walls.create(at(x), at(y), 'lab', 3);
      });
    });

    // ---- the sample rack and the freezer ----
    this.sample = this.physics.add.staticImage(at(6), at(8), 'tube');
    this.freezer = this.physics.add.staticSprite(at(26), at(8), 'freezer', 0);
    this.freezer.body.setSize(56, 48).setOffset(4, 14);
    // an invisible area in front of the freezer where you can store a sample
    this.dropZone = this.add.zone(this.freezer.x, this.freezer.y + 8, 104, 96);
    this.physics.add.existing(this.dropZone, true);

    // ---- carts: dynamic bodies that bounce forever ----
    this.carts = this.physics.add.group();
    this.addCart(at(15), at(13), 'x', 100);
    this.addCart(at(14), at(4), 'y', 90);

    // ---- the researcher ----
    this.player = new Researcher(this, at(3), at(8));
    this.carried = this.add.image(0, 0, 'tube').setVisible(false);
    this.carrying = false;
    this.stored = 0;

    // ---- what touches what ----
    this.physics.add.collider(this.player, this.walls);
    this.physics.add.collider(this.player, this.freezer);
    this.physics.add.collider(this.carts, this.walls);
    this.physics.add.collider(this.carts, this.freezer);
    this.physics.add.collider(this.player, this.carts, this.bump, null, this);
    this.physics.add.overlap(this.player, this.sample, this.pickUp, null, this);
    this.physics.add.overlap(this.player, this.dropZone, this.deliver, null, this);

    this.label = this.add
      .text(16, 12, 'Stored: 0', { fontFamily: 'monospace', fontSize: '20px', color: '#e2e8f0' })
      .setStroke('#0f172a', 4);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys('W,A,S,D');
    this.direction = new Phaser.Math.Vector2();
  }

  update() {
    const k = this.cursors;
    const w = this.wasd;
    this.direction.set(
      (k.right.isDown || w.D.isDown ? 1 : 0) - (k.left.isDown || w.A.isDown ? 1 : 0),
      (k.down.isDown || w.S.isDown ? 1 : 0) - (k.up.isDown || w.W.isDown ? 1 : 0),
    );
    if (this.direction.lengthSq() > 0) this.direction.normalize();
    // no delta here: physics bodies move by velocity, and Phaser applies delta for you
    this.player.walk(this.direction);

    if (this.carrying) this.carried.setPosition(this.player.x, this.player.y - 22);
  }

  addCart(x, y, axis, speed) {
    const cart = this.carts.create(x, y, 'cart');
    cart.setBounce(1).setCollideWorldBounds(true);
    cart.setPushable(false); // the player can't shove a cart out of its lane
    cart.setVelocity(axis === 'x' ? speed : 0, axis === 'y' ? speed : 0);
    return cart;
  }

  pickUp() {
    if (this.carrying) return;
    this.carrying = true;
    this.sample.disableBody(true, true); // hide it and turn its body off
    this.carried.setVisible(true);
    this.sound.play('pickup');
  }

  deliver() {
    if (!this.carrying) return;
    this.carrying = false;
    this.carried.setVisible(false);
    this.stored += 1;
    this.label.setText(`Stored: ${this.stored}`);
    this.sound.play('deliver');
    this.freezer.play('freezer-open'); // new
    // a new sample appears on the rack
    this.sample.enableBody(true, this.sample.x, this.sample.y, true, true);
  }

  bump(player, cart) {
    const away = new Phaser.Math.Vector2(player.x - cart.x, player.y - cart.y).normalize().scale(320);
    player.setVelocity(away.x, away.y);
    this.sound.play('bump');
  }
}
