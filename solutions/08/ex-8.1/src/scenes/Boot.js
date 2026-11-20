import Phaser from 'phaser';

// Loads everything once, shows a progress bar, then hands off to the title.
export class Boot extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    const { width, height } = this.scale;
    const bar = this.add.rectangle(width / 2 - 150, height / 2, 0, 12, 0x7dd3fc).setOrigin(0, 0.5);
    this.add.rectangle(width / 2, height / 2, 304, 16).setStrokeStyle(2, 0x475569);
    this.load.on('progress', (value) => (bar.width = 300 * value));

    this.load.setPath('assets');
    this.load.spritesheet('researcher', 'sprites/researcher.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('freezer', 'sprites/freezer.png', { frameWidth: 64, frameHeight: 64 });
    this.load.image('cart', 'sprites/cart.png');
    this.load.image('tube', 'sprites/tube.png');
    this.load.image('dry-ice', 'sprites/dry-ice.png');
    this.load.image('spill', 'sprites/spill.png');
    this.load.image('frost', 'sprites/frost.png');
    this.load.image('lab-tiles', 'tiles/lab.png');
    // the same tileset as numbered frames, for using single tiles as images
    this.load.spritesheet('lab', 'tiles/lab.png', { frameWidth: 32, frameHeight: 32 });
    this.load.tilemapTiledJSON('floor-1', 'maps/floor-1.tmj');
    this.load.tilemapTiledJSON('floor-2', 'maps/floor-2.tmj');
    for (const name of ['pickup', 'deliver', 'bump', 'warning', 'dryice', 'lose', 'win', 'click']) {
      this.load.audio(name, `audio/${name}.wav`);
    }
  }

  create() {
    // animations are global: make them once here, use them in any scene
    const walk = (key, start) =>
      this.anims.create({
        key,
        frames: this.anims.generateFrameNumbers('researcher', { start, end: start + 3 }),
        frameRate: 10,
        repeat: -1,
      });
    walk('walk-down', 0);
    walk('walk-up', 4);
    walk('walk-side', 8);

    this.scene.start('Title');
  }
}
