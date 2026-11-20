import Phaser from 'phaser';
import { formatTime, loadBestTime, toggleMute } from '../save.js';

export class Title extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create() {
    const { width, height } = this.scale;
    this.add.tileSprite(0, 0, width, height, 'lab', 0).setOrigin(0).setAlpha(0.12);

    this.add
      .text(width / 2, 140, 'COLD CHAIN', {
        fontFamily: 'monospace',
        fontSize: '72px',
        fontStyle: 'bold',
        color: '#e0f2fe',
      })
      .setOrigin(0.5)
      .setShadow(4, 4, '#0c4a6e', 0, false, true);

    this.add
      .text(width / 2, 210, 'Get the samples into the −80 before they thaw.', {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#94a3b8',
      })
      .setOrigin(0.5);

    const researcher = this.add.sprite(width / 2 - 70, 300, 'researcher').setScale(3).play('walk-side');
    this.add.image(width / 2 + 70, 300, 'freezer').setScale(1.5);
    this.tweens.add({ targets: researcher, x: width / 2 - 30, duration: 900, yoyo: true, repeat: -1 });

    const touch = this.sys.game.device.input.touch;
    const prompt = this.add
      .text(width / 2, 400, touch ? 'Tap to start' : 'Press SPACE to start', {
        fontFamily: 'monospace',
        fontSize: '24px',
        color: '#fde68a',
      })
      .setOrigin(0.5);
    this.tweens.add({ targets: prompt, alpha: 0.3, duration: 700, yoyo: true, repeat: -1 });

    const controls = touch ? 'Drag anywhere to walk' : 'Arrow keys or WASD to walk';
    this.add
      .text(width / 2, 450, controls, { fontFamily: 'monospace', fontSize: '16px', color: '#64748b' })
      .setOrigin(0.5);

    // new: M switches the sound on and off, here and during play
    const sound = this.add
      .text(width - 16, 16, '', { fontFamily: 'monospace', fontSize: '14px', color: '#64748b' })
      .setOrigin(1, 0);
    const showSound = () => sound.setText(this.registry.get('muted') ? 'SOUND OFF (M)' : 'SOUND ON (M)');
    showSound();
    this.input.keyboard.on('keydown-M', () => {
      toggleMute(this);
      showSound();
    });

    const best = loadBestTime();
    if (best !== null) {
      this.add
        .text(width / 2, 490, `Best time ${formatTime(best)}`, {
          fontFamily: 'monospace',
          fontSize: '16px',
          color: '#7dd3fc',
        })
        .setOrigin(0.5);
    }

    const start = () => {
      this.sound.play('click');
      this.scene.start('Play', { floor: 0, time: 0 });
      this.scene.launch('Hud');
    };
    this.input.keyboard.once('keydown-SPACE', start);
    this.input.once('pointerdown', start);
  }
}
