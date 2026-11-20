import Phaser from 'phaser';
import { Researcher } from '../objects/Researcher.js';

export class Play extends Phaser.Scene {
  constructor() {
    super('Play');
  }

  preload() {
    this.load.setPath('assets');
    this.load.image('lab-tiles', 'tiles/lab.png');
    this.load.tilemapTiledJSON('floor-1', 'maps/floor-1.tmj');
    this.load.spritesheet('researcher', 'sprites/researcher.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('freezer', 'sprites/freezer.png', { frameWidth: 64, frameHeight: 64 });
    this.load.image('tube', 'sprites/tube.png');
    this.load.image('cart', 'sprites/cart.png');
    this.load.image('spill', 'sprites/spill.png');
    this.load.audio('pickup', 'audio/pickup.wav');
    this.load.audio('deliver', 'audio/deliver.wav');
    this.load.audio('bump', 'audio/bump.wav');
  }

  create() {
    for (const [key, start] of [['walk-down', 0], ['walk-up', 4], ['walk-side', 8]]) {
      this.anims.create({
        key,
        frames: this.anims.generateFrameNumbers('researcher', { start, end: start + 3 }),
        frameRate: 10,
        repeat: -1,
      });
    }

    // ---- the world, from Tiled ----
    const map = this.make.tilemap({ key: 'floor-1' });
    // 'lab' is the tileset's name inside Tiled, 'lab-tiles' is our image key
    const tiles = map.addTilesetImage('lab', 'lab-tiles');
    map.createLayer('floor', tiles);
    map.createLayer('decor', tiles);
    this.walls = map.createLayer('walls', tiles);
    // every tile with the custom property collides = true becomes solid
    this.walls.setCollisionByProperty({ collides: true });
    // the world is now bigger than the screen
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    // ---- everything else comes from the object layer ----
    const objects = map.getObjectLayer('objects').objects;
    const all = (type) => objects.filter((o) => o.type === type);
    const one = (type) => all(type)[0];
    const prop = (o, name) => o.properties?.find((p) => p.name === name)?.value;

    this.spills = this.physics.add.staticGroup();
    for (const s of all('spill')) this.spills.create(s.x, s.y, 'spill');

    const rack = one('sample');
    this.sample = this.physics.add.staticImage(rack.x, rack.y, 'tube');

    const f = one('freezer');
    this.freezer = this.physics.add.staticSprite(f.x, f.y, 'freezer', 0);
    this.freezer.body.setSize(56, 48).setOffset(4, 14);
    this.dropZone = this.add.zone(f.x, f.y + 8, 104, 96);
    this.physics.add.existing(this.dropZone, true);

    this.carts = this.physics.add.group();
    for (const c of all('cart')) this.addCart(c.x, c.y, prop(c, 'axis'), prop(c, 'speed'));

    const start = one('player');
    this.player = new Researcher(this, start.x, start.y);
    this.carried = this.add.image(0, 0, 'tube').setVisible(false);
    this.carrying = false;
    this.stored = 0;

    // ---- what touches what ----
    this.physics.add.collider(this.player, this.walls);
    this.physics.add.collider(this.player, this.freezer);
    this.physics.add.collider(this.carts, this.walls);
    this.physics.add.collider(this.carts, this.freezer);
    this.physics.add.collider(this.carts, this.carts);
    this.physics.add.collider(this.player, this.carts, this.bump, null, this);
    this.physics.add.overlap(this.player, this.sample, this.pickUp, null, this);
    this.physics.add.overlap(this.player, this.dropZone, this.deliver, null, this);

    // ---- the camera follows you around the bigger world ----
    const cam = this.cameras.main;
    cam.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    cam.startFollow(this.player, true, 0.12, 0.12); // lerp: follow smoothly, not rigidly

    // scrollFactor 0: pinned to the screen, not the world
    this.label = this.add
      .text(16, 12, 'Stored: 0', { fontFamily: 'monospace', fontSize: '20px', color: '#e2e8f0' })
      .setStroke('#0f172a', 4)
      .setScrollFactor(0);

    // new: a minimap in the top-right corner. A second camera, zoomed out to fit
    // the whole map into 200 pixels, that never moves.
    const miniWidth = 200;
    const zoom = miniWidth / map.widthInPixels;
    const miniHeight = Math.round(map.heightInPixels * zoom);
    this.minimap = this.cameras
      .add(this.scale.width - miniWidth - 16, 16, miniWidth, miniHeight)
      .setZoom(zoom)
      .setBackgroundColor(0x0f172a)
      .centerOn(map.widthInPixels / 2, map.heightInPixels / 2);
    this.minimap.ignore(this.label); // the label is for the main camera only

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

    // overlap() with no callback just answers yes or no
    const onSpill = this.physics.overlap(this.player, this.spills);
    this.player.walk(this.direction, onSpill);

    if (this.carrying) this.carried.setPosition(this.player.x, this.player.y - 22);
  }

  addCart(x, y, axis = 'x', speed = 100) {
    const cart = this.carts.create(x, y, 'cart');
    cart.setBounce(1).setCollideWorldBounds(true).setPushable(false);
    cart.body.setSize(28, 26).setOffset(2, 2);
    cart.setVelocity(axis === 'x' ? speed : 0, axis === 'y' ? speed : 0);
    return cart;
  }

  pickUp() {
    if (this.carrying) return;
    this.carrying = true;
    this.sample.disableBody(true, true);
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
    this.sample.enableBody(true, this.sample.x, this.sample.y, true, true);
  }

  bump(player, cart) {
    const away = new Phaser.Math.Vector2(player.x - cart.x, player.y - cart.y).normalize().scale(320);
    player.setVelocity(away.x, away.y);
    this.sound.play('bump');
  }
}
