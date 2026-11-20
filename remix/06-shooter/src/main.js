import Phaser from 'phaser';

// REMIX 6: a flat, joyless shooter.
// Left and right to move, space to fire. Contaminated plates fall; shoot them
// before they reach the bottom. Everything works. Nothing feels like anything.
// Add feedback (lesson 9) until it's fun: sound, particles, tweens, shake.
// Don't change the rules.

class Shooter extends Phaser.Scene {
  constructor() {
    super('Shooter');
  }

  preload() {
    this.load.setPath('assets');
    this.load.image('frost', 'sprites/frost.png');
    this.load.audio('click', 'audio/click.wav');
    this.load.audio('bump', 'audio/bump.wav');
    this.load.audio('lose', 'audio/lose.wav');
  }

  create() {
    const { width, height } = this.scale;
    this.ship = this.add.rectangle(width / 2, height - 40, 48, 20, 0x7dd3fc);
    this.physics.add.existing(this.ship);
    this.ship.body.setCollideWorldBounds(true);

    this.shots = this.physics.add.group();
    this.plates = this.physics.add.group();
    this.physics.add.overlap(this.shots, this.plates, this.hit, null, this);

    this.score = 0;
    this.missed = 0;
    this.label = this.add.text(16, 12, '', { fontFamily: 'monospace', fontSize: '22px', color: '#e2e8f0' });

    this.time.addEvent({ delay: 700, loop: true, callback: () => this.drop() });
    this.cursors = this.input.keyboard.createCursorKeys();
    this.cooldown = 0;
  }

  drop() {
    const plate = this.add.rectangle(Phaser.Math.Between(40, this.scale.width - 40), -20, 44, 44, 0xfca5a5);
    this.plates.add(plate);
    plate.body.setVelocityY(Phaser.Math.Between(90, 170));
  }

  fire() {
    const shot = this.add.rectangle(this.ship.x, this.ship.y - 20, 6, 16, 0xfde68a);
    this.shots.add(shot);
    shot.body.setVelocityY(-620);
  }

  hit(shot, plate) {
    shot.destroy();
    plate.destroy();
    this.score += 1;
  }

  update(time, delta) {
    const k = this.cursors;
    this.ship.body.setVelocityX(((k.right.isDown ? 1 : 0) - (k.left.isDown ? 1 : 0)) * 420);

    this.cooldown -= delta;
    if (k.space.isDown && this.cooldown <= 0) {
      this.fire();
      this.cooldown = 180;
    }

    for (const shot of this.shots.getChildren()) if (shot.y < -20) shot.destroy();
    for (const plate of this.plates.getChildren()) {
      if (plate.y > this.scale.height + 20) {
        plate.destroy();
        this.missed += 1;
      }
    }
    this.label.setText(`Cleaned ${this.score}   Missed ${this.missed}`);
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
  scene: [Shooter],
});
