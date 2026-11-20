import Phaser from 'phaser';
import { tuning } from '../tuning.js';

// The player. A physics sprite that knows how to walk and which way it faces.
export class Researcher extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'researcher', 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    // a body around the feet, so you can walk "behind" the top of a bench
    this.body.setSize(18, 14).setOffset(7, 17);
    this.facing = 'down';
  }

  // direction: a vector with x and y between -1 and 1
  walk(direction, onSpill) {
    const p = tuning.player;
    this.setMaxVelocity(onSpill ? p.spillMaxSpeed : p.maxSpeed);
    this.setDrag(onSpill ? p.spillDrag : p.drag);
    this.setAcceleration(direction.x * p.acceleration, direction.y * p.acceleration);

    if (direction.lengthSq() > 0.01) {
      this.facing = Math.abs(direction.x) > Math.abs(direction.y) ? 'side' : direction.y < 0 ? 'up' : 'down';
      if (direction.x !== 0) this.setFlipX(direction.x < 0);
      this.anims.play(`walk-${this.facing}`, true);
    } else if (this.body.speed < 30) {
      this.anims.stop();
      this.setFrame({ down: 1, up: 5, side: 9 }[this.facing]);
    }
  }
}
