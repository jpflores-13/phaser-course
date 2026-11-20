import Phaser from 'phaser';

const MAX_SPEED = 220; // pixels per second
const ACCELERATION = 1400; // how fast you reach max speed
const DRAG = 1800; // how fast you stop on a dry floor
const SPILL_DRAG = 90; // ...and on a spill
const SPILL_MAX_SPEED = 300;

// The player. A physics sprite that knows how to walk and which way it faces.
export class Researcher extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'researcher', 1);
    scene.add.existing(this); // put it on screen
    scene.physics.add.existing(this); // give it a body

    this.setCollideWorldBounds(true);
    // a body around the feet, so you can walk "behind" the top of a bench
    this.body.setSize(18, 14).setOffset(7, 17);
    this.facing = 'down';
  }

  // direction: a vector with x and y between -1 and 1
  walk(direction, onSpill = false) {
    this.setMaxVelocity(onSpill ? SPILL_MAX_SPEED : MAX_SPEED);
    this.setDrag(onSpill ? SPILL_DRAG : DRAG);
    this.setAcceleration(direction.x * ACCELERATION, direction.y * ACCELERATION);

    if (direction.lengthSq() > 0.01) {
      this.facing = Math.abs(direction.x) > Math.abs(direction.y) ? 'side' : direction.y < 0 ? 'up' : 'down';
      if (direction.x !== 0) this.setFlipX(direction.x < 0);
      this.anims.play(`walk-${this.facing}`, true); // true: don't restart if it's already playing
    } else if (this.body.speed < 30) {
      this.anims.stop();
      this.setFrame({ down: 1, up: 5, side: 9 }[this.facing]);
    }
  }
}
