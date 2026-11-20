import Phaser from 'phaser';

// REMIX 4, solved: load on start, save every 5 seconds and when the page closes.

const ROBOT_COST = 10;
const SAVE_KEY = 'remix-clicker:save'; // new: namespaced, one object as JSON

// new: storage can be missing or blocked, so both are wrapped
function load() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(SAVE_KEY));
    return { samples: Number(saved?.samples) || 0, robots: Number(saved?.robots) || 0 };
  } catch {
    return { samples: 0, robots: 0 };
  }
}

function save(state) {
  try {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch {
    // not saved: the game still works
  }
}

class Clicker extends Phaser.Scene {
  constructor() {
    super('Clicker');
  }

  preload() {
    this.load.setPath('assets');
    this.load.spritesheet('freezer', 'sprites/freezer.png', { frameWidth: 64, frameHeight: 64 });
    this.load.audio('click', 'audio/click.wav');
    this.load.audio('pickup', 'audio/pickup.wav');
  }

  create() {
    const { width, height } = this.scale;
    // new: start from the save, if there is one
    ({ samples: this.samples, robots: this.robots } = load());

    this.freezer = this.add.sprite(width / 2, height / 2 - 20, 'freezer', 0).setScale(3).setInteractive();
    this.freezer.on('pointerdown', () => {
      this.samples += 1;
      this.sound.play('click');
      this.freezer.setFrame(1);
      this.time.delayedCall(80, () => this.freezer.setFrame(0));
    });

    const style = { fontFamily: 'monospace', fontSize: '28px', color: '#e2e8f0' };
    this.counter = this.add.text(width / 2, 60, '', style).setOrigin(0.5);
    this.button = this.add
      .text(width / 2, height - 70, '', { ...style, fontSize: '22px', backgroundColor: '#334155', padding: { x: 16, y: 10 } })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    this.button.on('pointerdown', () => {
      if (this.samples < ROBOT_COST) return;
      this.samples -= ROBOT_COST;
      this.robots += 1;
      this.sound.play('pickup');
    });

    // every second, each robot stores one sample
    this.time.addEvent({ delay: 1000, loop: true, callback: () => (this.samples += this.robots) });

    // new: save every 5 seconds, and when the tab is hidden or closed
    const saveNow = () => save({ samples: this.samples, robots: this.robots });
    this.time.addEvent({ delay: 5000, loop: true, callback: saveNow });
    this.game.events.on('hidden', saveNow);
    window.addEventListener('pagehide', saveNow);
  }

  update() {
    this.counter.setText(`${this.samples} samples stored`);
    this.button.setText(`Buy a robot (${ROBOT_COST})  ·  ${this.robots} working`);
    this.button.setAlpha(this.samples >= ROBOT_COST ? 1 : 0.5);
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
  scene: [Clicker],
});
