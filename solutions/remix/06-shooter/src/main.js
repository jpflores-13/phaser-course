import Phaser from 'phaser';

// REMIX 6, solved: the same rules, with feedback on every action.
// Every change is marked "new". Try turning them off one at a time.

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

    // new: one burst emitter, reused for every hit
    this.burst = this.add.particles(0, 0, 'frost', {
      speed: { min: 80, max: 240 },
      lifespan: 500,
      scale: { start: 1.6, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: [0xfca5a5, 0xffffff],
      emitting: false,
    });

    this.time.addEvent({ delay: 700, loop: true, callback: () => this.drop() });
    this.cursors = this.input.keyboard.createCursorKeys();
    this.cooldown = 0;
  }

  drop() {
    const plate = this.add.rectangle(Phaser.Math.Between(40, this.scale.width - 40), -20, 44, 44, 0xfca5a5);
    this.plates.add(plate);
    plate.body.setVelocityY(Phaser.Math.Between(90, 170));
    // new: plates pop in instead of appearing
    this.tweens.add({ targets: plate, scale: { from: 0, to: 1 }, duration: 250, ease: 'Back.Out' });
  }

  fire() {
    const shot = this.add.rectangle(this.ship.x, this.ship.y - 20, 6, 16, 0xfde68a);
    this.shots.add(shot);
    shot.body.setVelocityY(-620);
    // new: a click, and the ship kicks back a little
    this.sound.play('click', { volume: 0.4, rate: Phaser.Math.FloatBetween(0.9, 1.1) });
    this.tweens.add({ targets: this.ship, y: this.ship.y + 4, duration: 50, yoyo: true });
  }

  hit(shot, plate) {
    shot.destroy();
    plate.body.enable = false; // new: stop it, flash it white, then remove it
    plate.setFillStyle(0xffffff);
    this.time.delayedCall(40, () => plate.destroy());
    this.burst.explode(14, plate.x, plate.y);
    this.sound.play('bump', { volume: 0.6, rate: 1.4 });
    this.cameras.main.shake(80, 0.004);
    this.score += 1;
    this.tweens.add({ targets: this.label, scale: { from: 1.25, to: 1 }, duration: 200, ease: 'Back.Out' });
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
        // new: a miss is bad news, so it gets a red flash and a sad sound
        this.cameras.main.flash(150, 255, 80, 80);
        this.sound.play('lose', { volume: 0.3, rate: 1.6 });
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
