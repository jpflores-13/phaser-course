import Phaser from 'phaser';

// REMIX 3, solved: a camera that follows, with bounds, and a pinned message.

class Dungeon extends Phaser.Scene {
  constructor() {
    super('Dungeon');
  }

  preload() {
    this.load.setPath('assets');
    this.load.image('lab-tiles', 'tiles/lab.png');
    this.load.tilemapTiledJSON('floor-2', 'maps/floor-2.tmj');
    this.load.spritesheet('researcher', 'sprites/researcher.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('freezer', 'sprites/freezer.png', { frameWidth: 64, frameHeight: 64 });
    this.load.audio('win', 'audio/win.wav');
  }

  create() {
    const map = this.make.tilemap({ key: 'floor-2' });
    const tiles = map.addTilesetImage('lab', 'lab-tiles');
    map.createLayer('floor', tiles);
    map.createLayer('decor', tiles);
    const walls = map.createLayer('walls', tiles);
    walls.setCollisionByProperty({ collides: true });
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    const objects = map.getObjectLayer('objects').objects;
    const start = objects.find((o) => o.type === 'player');
    const f = objects.find((o) => o.type === 'freezer');

    this.freezer = this.physics.add.staticSprite(f.x, f.y, 'freezer', 0);
    this.player = this.physics.add.sprite(start.x, start.y, 'researcher', 1);
    this.player.setCollideWorldBounds(true);
    this.player.body.setSize(18, 14).setOffset(7, 17);
    this.physics.add.collider(this.player, walls);
    this.physics.add.overlap(this.player, this.freezer, this.found, null, this);

    this.message = this.add
      .text(16, 16, 'Find the −80', { fontFamily: 'monospace', fontSize: '22px', color: '#e2e8f0' })
      .setStroke('#0f172a', 4)
      .setScrollFactor(0); // new: pinned to the screen, not the world

    // new: the camera follows the researcher, and stops at the edges of the map
    const cam = this.cameras.main;
    cam.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    cam.startFollow(this.player, true, 0.12, 0.12);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.done = false;
  }

  found() {
    if (this.done) return;
    this.done = true;
    this.freezer.setFrame(1);
    this.message.setText('Found it!');
    this.sound.play('win');
  }

  update() {
    const k = this.cursors;
    const dir = new Phaser.Math.Vector2(
      (k.right.isDown ? 1 : 0) - (k.left.isDown ? 1 : 0),
      (k.down.isDown ? 1 : 0) - (k.up.isDown ? 1 : 0),
    ).normalize();
    this.player.setVelocity(dir.x * 240, dir.y * 240);
    if (dir.x !== 0) this.player.setFrame(9).setFlipX(dir.x < 0);
    else if (dir.y !== 0) this.player.setFrame(dir.y < 0 ? 5 : 1);
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: 960,
  height: 540,
  backgroundColor: '#1e2530',
  pixelArt: true,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: { default: 'arcade' },
  scene: [Dungeon],
});
