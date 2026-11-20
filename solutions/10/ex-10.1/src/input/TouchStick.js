import Phaser from 'phaser';

// A floating joystick: put a finger down anywhere and drag.
// `vector` has x and y between -1 and 1, like the arrow keys.
export class TouchStick {
  constructor(scene, radius = 56) {
    this.scene = scene;
    this.radius = radius;
    this.vector = new Phaser.Math.Vector2();
    this.pointerId = null;

    this.base = scene.add.circle(0, 0, radius, 0xffffff, 0.12).setStrokeStyle(2, 0xffffff, 0.4);
    this.knob = scene.add.circle(0, 0, radius * 0.45, 0xffffff, 0.35);
    for (const part of [this.base, this.knob]) {
      part.setScrollFactor(0).setDepth(1000).setVisible(false);
    }

    scene.input.on('pointerdown', this.onDown, this);
    scene.input.on('pointermove', this.onMove, this);
    scene.input.on('pointerup', this.onUp, this);
    scene.events.once('shutdown', () => {
      scene.input.off('pointerdown', this.onDown, this);
      scene.input.off('pointermove', this.onMove, this);
      scene.input.off('pointerup', this.onUp, this);
    });
  }

  onDown(pointer) {
    if (this.pointerId !== null) return;
    this.pointerId = pointer.id;
    this.base.setPosition(pointer.x, pointer.y).setVisible(true);
    this.knob.setPosition(pointer.x, pointer.y).setVisible(true);
  }

  onMove(pointer) {
    if (pointer.id !== this.pointerId) return;
    const dx = pointer.x - this.base.x;
    const dy = pointer.y - this.base.y;
    const length = Math.min(Math.hypot(dx, dy), this.radius);
    const angle = Math.atan2(dy, dx);
    this.knob.setPosition(this.base.x + Math.cos(angle) * length, this.base.y + Math.sin(angle) * length);
    this.vector.set(Math.cos(angle), Math.sin(angle)).scale(length / this.radius);
  }

  onUp(pointer) {
    if (pointer.id !== this.pointerId) return;
    this.pointerId = null;
    this.vector.set(0, 0);
    this.base.setVisible(false);
    this.knob.setVisible(false);
  }
}
