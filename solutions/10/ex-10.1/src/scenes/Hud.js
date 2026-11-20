import Phaser from 'phaser';
import { formatTime, toggleMute } from '../save.js';
import { tuning } from '../tuning.js';

// Runs on top of Play (scene.launch). It never touches Play directly:
// it only reads the registry and redraws when a value changes.
export class Hud extends Phaser.Scene {
  constructor() {
    super('Hud');
  }

  create() {
    const text = (x, y, size = '18px') =>
      this.add.text(x, y, '', { fontFamily: 'monospace', fontSize: size, color: '#e2e8f0' }).setStroke('#0f172a', 4);

    this.add.rectangle(0, 0, 960, 44, 0x0f172a, 0.75).setOrigin(0);
    this.label = text(16, 12);
    this.add.rectangle(200, 22, 204, 18).setStrokeStyle(2, 0x94a3b8).setOrigin(0, 0.5);
    this.bar = this.add.rectangle(202, 22, 0, 14, 0x38bdf8).setOrigin(0, 0.5);
    this.delivered = text(440, 12);
    this.floor = text(640, 12);
    this.clock = text(820, 12);

    this.pulse = this.tweens.add({ targets: this.bar, alpha: 0.35, duration: 180, yoyo: true, repeat: -1, paused: true });

    // new: M mutes during play too
    this.input.keyboard.on('keydown-M', () => toggleMute(this));

    this.registry.events.on('changedata', this.redraw, this);
    this.events.once('shutdown', () => this.registry.events.off('changedata', this.redraw, this));
    this.redraw();
  }

  redraw() {
    const r = this.registry;
    const thaw = r.get('thaw') ?? 0;
    const carrying = r.get('carrying');

    this.label.setText(carrying ? 'THAW' : 'GET SAMPLE');
    this.label.setColor(carrying ? '#e2e8f0' : '#fde68a');
    this.bar.width = carrying ? 2 * thaw : 0;

    // blue when cold, red when nearly thawed
    const colour = Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.ValueToColor(0x38bdf8),
      Phaser.Display.Color.ValueToColor(0xef4444),
      100,
      thaw,
    );
    this.bar.fillColor = Phaser.Display.Color.GetColor(colour.r, colour.g, colour.b);

    const danger = carrying && thaw >= tuning.thaw.warnAt;
    if (danger && this.pulse.paused) this.pulse.resume();
    if (!danger && !this.pulse.paused) {
      this.pulse.pause();
      this.bar.setAlpha(1);
    }

    this.delivered.setText(`STORED ${r.get('delivered') ?? 0}/${r.get('target') ?? 0}`);
    this.floor.setText(`FLOOR ${r.get('floor') ?? 1}`);
    this.clock.setText(formatTime(r.get('time') ?? 0));
  }
}
