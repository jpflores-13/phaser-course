import Phaser from 'phaser';

export class Play extends Phaser.Scene {
  constructor() {
    super('Play'); // the scene's key: its name inside the game
  }

  // 1. preload: ask for files. Nothing is on screen yet.
  preload() {
    this.load.setPath('assets');
    this.load.spritesheet('lab', 'tiles/lab.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('researcher', 'sprites/researcher.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('freezer', 'sprites/freezer.png', { frameWidth: 64, frameHeight: 64 });
    this.load.image('tube', 'sprites/tube.png'); // new: a plain image, not a spritesheet
  }

  // 2. create: every file has loaded. Build the scene once.
  create() {
    const { width, height } = this.scale;

    // a floor: one 32 x 32 tile (frame 0 of the tileset), repeated
    this.add.tileSprite(0, 0, width, height, 'lab', 0).setOrigin(0, 0);

    // the freezer, against the right wall
    this.add.image(width - 120, height / 2, 'freezer', 0).setScale(2);

    // new: a sample on the bench, left of the researcher
    this.add.image(140, height / 2, 'tube').setScale(2);

    // the researcher, in the middle, facing us
    this.player = this.add.sprite(width / 2, height / 2, 'researcher', 1).setScale(2);

    this.add
      .text(width / 2, 60, 'COLD CHAIN', {
        fontFamily: 'monospace',
        fontSize: '48px',
        fontStyle: 'bold',
        color: '#0c4a6e',
      })
      .setOrigin(0.5);
  }

  // 3. update: runs every frame, about 60 times a second. Empty for now.
  update(time, delta) {}
}
