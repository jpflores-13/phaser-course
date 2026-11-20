import Phaser from 'phaser';

// new: an overlay that runs on top of a paused Play scene
export class Pause extends Phaser.Scene {
  constructor() {
    super('Pause');
  }

  create() {
    const { width, height } = this.scale;
    this.add.rectangle(0, 0, width, height, 0x0f172a, 0.7).setOrigin(0);
    this.add
      .text(width / 2, height / 2 - 20, 'PAUSED', { fontFamily: 'monospace', fontSize: '48px', color: '#e0f2fe' })
      .setOrigin(0.5);
    this.add
      .text(width / 2, height / 2 + 40, 'P or ESC to carry on', { fontFamily: 'monospace', fontSize: '18px', color: '#94a3b8' })
      .setOrigin(0.5);

    const resume = () => {
      this.scene.resume('Play');
      this.scene.stop(); // stop this overlay
    };
    this.input.keyboard.once('keydown-P', resume);
    this.input.keyboard.once('keydown-ESC', resume);
  }
}
