import Phaser from 'phaser';

// REMIX 2: Breakout without bricks.
// The paddle and the ball work. There's nothing to break.
// Add rows of bricks. The ball should bounce off a brick and destroy it,
// and the game should say you've won when there are none left.

class Breakout extends Phaser.Scene {
  constructor() {
    super('Breakout');
  }

  preload() {
    this.load.audio('blip', 'assets/audio/click.wav');
    this.load.audio('lose', 'assets/audio/lose.wav');
  }

  create() {
    const { width, height } = this.scale;

    this.paddle = this.add.rectangle(width / 2, height - 40, 120, 16, 0xe2e8f0);
    this.physics.add.existing(this.paddle);
    this.paddle.body.setImmovable(true).setCollideWorldBounds(true);

    this.ball = this.add.rectangle(width / 2, height - 70, 14, 14, 0xfde68a);
    this.physics.add.existing(this.ball);
    this.ball.body.setBounce(1, 1).setCollideWorldBounds(true);
    // the bottom edge is open: that's how you lose
    this.physics.world.setBoundsCollision(true, true, true, false);

    this.physics.add.collider(this.ball, this.paddle, this.hitPaddle, null, this);

    this.message = this.add
      .text(width / 2, height / 2, 'Click to launch', { fontFamily: 'monospace', fontSize: '28px', color: '#e2e8f0' })
      .setOrigin(0.5);
    this.input.on('pointerdown', () => this.launch());
    this.followMouse = false;
    this.input.on('pointermove', () => (this.followMouse = true));
    this.cursors = this.input.keyboard.createCursorKeys();
    this.launched = false;
  }

  launch() {
    if (this.launched) return;
    this.launched = true;
    this.message.setText('');
    this.ball.body.setVelocity(Phaser.Math.Between(-150, 150), -320);
  }

  hitPaddle(ball, paddle) {
    // where on the paddle you hit decides the angle
    ball.body.setVelocityX((ball.x - paddle.x) * 6);
    this.sound.play('blip');
  }

  update() {
    // the arrow keys, or follow the mouse (by velocity, so physics sees the movement)
    const k = this.cursors;
    if (k.left.isDown || k.right.isDown) {
      this.paddle.body.setVelocityX(k.left.isDown ? -480 : 480);
      this.followMouse = false;
    } else if (!this.followMouse) {
      this.paddle.body.setVelocityX(0);
    } else {
      const gap = this.input.activePointer.x - this.paddle.x;
      this.paddle.body.setVelocityX(Phaser.Math.Clamp(gap * 12, -900, 900));
    }

    if (!this.launched) this.ball.body.reset(this.paddle.x, this.paddle.y - 30);

    if (this.ball.y > this.scale.height + 20) {
      this.sound.play('lose');
      this.launched = false;
      this.message.setText('Missed! Click to launch');
    }
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
  scene: [Breakout],
});
