import Phaser from 'phaser';

// REMIX 1, solved: the computer's paddle follows the ball, at a limited speed.

class Pong extends Phaser.Scene {
  constructor() {
    super('Pong');
  }

  preload() {
    this.load.audio('blip', 'assets/audio/click.wav');
  }

  create() {
    const { width, height } = this.scale;
    this.add.rectangle(width / 2, height / 2, 4, height, 0x334155);

    this.player = this.add.rectangle(40, height / 2, 16, 96, 0xe2e8f0);
    this.physics.add.existing(this.player);
    this.player.body.setImmovable(true).setCollideWorldBounds(true);

    this.cpu = this.add.rectangle(width - 40, height / 2, 16, 96, 0xfca5a5);
    this.physics.add.existing(this.cpu);
    this.cpu.body.setImmovable(true).setCollideWorldBounds(true);

    this.ball = this.add.rectangle(width / 2, height / 2, 14, 14, 0xfde68a);
    this.physics.add.existing(this.ball);
    this.ball.body.setBounce(1, 1).setCollideWorldBounds(true);
    // the left and right edges are open: that's how points are scored
    this.physics.world.setBoundsCollision(false, false, true, true);
    this.physics.add.collider(this.ball, [this.player, this.cpu], () => this.sound.play('blip'));

    this.score = { player: 0, cpu: 0 };
    this.label = this.add
      .text(width / 2, 24, '0 : 0', { fontFamily: 'monospace', fontSize: '32px', color: '#e2e8f0' })
      .setOrigin(0.5, 0);
    this.keys = this.input.keyboard.addKeys('W,S,UP,DOWN');
    this.serve(1);
  }

  serve(direction) {
    this.ball.body.reset(this.scale.width / 2, this.scale.height / 2);
    this.ball.body.setVelocity(260 * direction, Phaser.Math.Between(-160, 160));
  }

  update() {
    const k = this.keys;
    const up = k.W.isDown || k.UP.isDown;
    const down = k.S.isDown || k.DOWN.isDown;
    this.player.body.setVelocityY(((down ? 1 : 0) - (up ? 1 : 0)) * 360);

    // the computer's paddle: chase the ball's height, but never faster than CPU_SPEED,
    // so a fast, steep ball can get past it
    const CPU_SPEED = 230;
    const gap = this.ball.y - this.cpu.y;
    this.cpu.body.setVelocityY(Phaser.Math.Clamp(gap * 5, -CPU_SPEED, CPU_SPEED));

    if (this.ball.x < -20) {
      this.score.cpu += 1;
      this.serve(1);
    } else if (this.ball.x > this.scale.width + 20) {
      this.score.player += 1;
      this.serve(-1);
    }
    this.label.setText(`${this.score.player} : ${this.score.cpu}`);
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: 960,
  height: 540,
  backgroundColor: '#1e2530',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: { default: 'arcade' },
  scene: [Pong],
});
