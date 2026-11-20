import Phaser from 'phaser';
import { formatTime, loadBestTime, saveBestTime } from '../save.js';

export class Results extends Phaser.Scene {
  constructor() {
    super('Results');
  }

  init(data) {
    this.won = data.won;
    this.runTime = data.time;
    this.floor = data.floor;
  }

  create() {
    const { width } = this.scale;
    const style = (size, color) => ({ fontFamily: 'monospace', fontSize: size, color });

    this.add
      .text(width / 2, 130, this.won ? 'ALL SAMPLES STORED' : 'SAMPLE THAWED', style('48px', this.won ? '#7dd3fc' : '#fca5a5'))
      .setOrigin(0.5);

    const lines = [];
    if (this.won) {
      const record = saveBestTime(this.runTime);
      lines.push(`Time ${formatTime(this.runTime)}`);
      lines.push(record ? 'New best time!' : `Best ${formatTime(loadBestTime())}`);
    } else {
      lines.push(`You made it to floor ${this.floor}.`);
      lines.push('Dry ice buys time. Carts cost it.');
    }
    this.add.text(width / 2, 240, lines.join('\n'), { ...style('24px', '#e2e8f0'), align: 'center', lineSpacing: 12 }).setOrigin(0.5);

    const touch = this.sys.game.device.input.touch;
    const prompt = this.add
      .text(width / 2, 400, touch ? 'Tap to play again' : 'Press SPACE to play again', style('22px', '#fde68a'))
      .setOrigin(0.5);
    this.tweens.add({ targets: prompt, alpha: 0.3, duration: 700, yoyo: true, repeat: -1 });

    // a short pause so a held key or tap doesn't skip this screen
    this.time.delayedCall(500, () => {
      const again = () => this.scene.start('Title');
      this.input.keyboard.once('keydown-SPACE', again);
      this.input.once('pointerdown', again);
    });
  }
}
