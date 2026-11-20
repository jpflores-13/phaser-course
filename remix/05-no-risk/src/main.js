import Phaser from 'phaser';

// REMIX 5: a game with no reason to take risks.
// Cross the lab from the mat on the left to the freezer on the right. Carts
// patrol three lanes; a cart knocks you back. Your time is your score.
// It works, but there's only ever one plan: dodge, and go straight.
// Add a risk and reward choice: something worth a detour that costs you
// something to get. Good players should take it sometimes, not always.

const SPEED = 220;

class Crossing extends Phaser.Scene {
  constructor() {
    super('Crossing');
  }

  preload() {
    this.load.setPath('assets');
    this.load.spritesheet('researcher', 'sprites/researcher.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('freezer', 'sprites/freezer.png', { frameWidth: 64, frameHeight: 64 });
    this.load.image('cart', 'sprites/cart.png');
    this.load.image('dry-ice', 'sprites/dry-ice.png');
    this.load.audio('bump', 'audio/bump.wav');
    this.load.audio('win', 'audio/win.wav');
    this.load.audio('dryice', 'audio/dryice.wav');
  }

  create() {
    const { width, height } = this.scale;
    this.add.rectangle(0, 0, width, height, 0xd8dee6).setOrigin(0);
    for (const x of [300, 480, 660]) this.add.rectangle(x, height / 2, 90, height, 0xcbd5e1);

    this.freezer = this.physics.add.staticSprite(width - 70, height / 2, 'freezer', 0);
    this.player = this.physics.add.sprite(70, height / 2, 'researcher', 9).setScale(1.5);
    this.player.setCollideWorldBounds(true);

    this.carts = this.physics.add.group();
    [[300, 140], [480, 220], [660, 300]].forEach(([x, speed], i) => {
      const cart = this.carts.create(x, 100 + i * 150, 'cart').setScale(1.5);
      cart.setBounce(1).setCollideWorldBounds(true).setPushable(false);
      cart.setVelocityY(i % 2 ? -speed : speed);
    });

    this.physics.add.collider(this.player, this.carts, this.bump, null, this);
    this.physics.add.overlap(this.player, this.freezer, this.finish, null, this);

    this.clock = this.add.text(16, 12, '', { fontFamily: 'monospace', fontSize: '24px', color: '#0f172a' });
    this.elapsed = 0;
    this.penalty = 0;
    this.knocked = 0;
    this.done = false;
    this.cursors = this.input.keyboard.createCursorKeys();
    this.input.keyboard.on('keydown-R', () => this.scene.restart());
  }

  bump(player, cart) {
    if (this.knocked > 0) return; // one hit per bump, not one per frame
    const away = new Phaser.Math.Vector2(player.x - cart.x, player.y - cart.y).normalize().scale(400);
    player.setVelocity(away.x, away.y);
    this.knocked = 250; // ms without control
    this.sound.play('bump');
  }

  finish() {
    if (this.done) return;
    this.done = true;
    this.player.setVelocity(0);
    this.freezer.setFrame(1);
    this.sound.play('win');
    this.clock.setText(`Done in ${this.score().toFixed(1)} s. Press R to go again.`);
  }

  score() {
    return this.elapsed / 1000 + this.penalty;
  }

  update(time, delta) {
    if (this.done) return;
    this.elapsed += delta;
    this.clock.setText(`${this.score().toFixed(1)} s`);

    if (this.knocked > 0) {
      this.knocked -= delta;
      return;
    }
    const k = this.cursors;
    const dir = new Phaser.Math.Vector2(
      (k.right.isDown ? 1 : 0) - (k.left.isDown ? 1 : 0),
      (k.down.isDown ? 1 : 0) - (k.up.isDown ? 1 : 0),
    ).normalize();
    this.player.setVelocity(dir.x * SPEED, dir.y * SPEED);
    if (dir.x !== 0) this.player.setFrame(9).setFlipX(dir.x < 0);
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
  scene: [Crossing],
});
