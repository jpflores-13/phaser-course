import Phaser from 'phaser';
import { Researcher } from '../objects/Researcher.js';
import { TouchStick } from '../input/TouchStick.js';
import { tuning } from '../tuning.js';

export class Play extends Phaser.Scene {
  constructor() {
    super('Play');
  }

  // data comes from scene.start('Play', { floor, time })
  init(data) {
    this.floorIndex = data.floor ?? 0;
    this.elapsed = data.time ?? 0;
    this.carrying = false;
    this.thaw = 0;
    this.warned = false;
    this.delivered = 0;
    this.invulnerable = false;
    this.finished = false;
  }

  create() {
    const floor = tuning.floors[this.floorIndex];

    // ---- the world, from Tiled ----
    const map = this.make.tilemap({ key: floor.map });
    const tiles = map.addTilesetImage('lab', 'lab-tiles');
    map.createLayer('floor', tiles);
    map.createLayer('decor', tiles);
    this.walls = map.createLayer('walls', tiles);
    this.walls.setCollisionByProperty({ collides: true });
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    const objects = map.getObjectLayer('objects').objects;
    const all = (type) => objects.filter((o) => o.type === type);
    const one = (type) => all(type)[0];
    const prop = (o, name) => o.properties?.find((p) => p.name === name)?.value;

    // ---- things on the floor ----
    this.spills = this.physics.add.staticGroup();
    for (const s of all('spill')) this.spills.create(s.x, s.y, 'spill').setDepth(1);

    const rack = one('sample');
    this.sample = this.physics.add.staticImage(rack.x, rack.y, 'tube').setDepth(2);

    const f = one('freezer');
    this.freezer = this.physics.add.staticSprite(f.x, f.y, 'freezer', 0).setDepth(3);
    this.freezer.body.setSize(56, 48).setOffset(4, 14);
    this.dropZone = this.add.zone(f.x, f.y + 8, 104, 96);
    this.physics.add.existing(this.dropZone, true);

    this.dryIceSpots = all('dryice');
    this.dryIce = this.physics.add.staticImage(0, 0, 'dry-ice').setDepth(2);
    this.dryIce.disableBody(true, true);
    this.tweens.add({ targets: this.dryIce, scale: 1.15, duration: 500, yoyo: true, repeat: -1 });

    // ---- carts ----
    this.cartSpawns = all('cartspawn');
    this.carts = this.physics.add.group();
    for (const c of all('cart')) this.addCart(c.x, c.y, prop(c, 'axis'), prop(c, 'speed'));

    // ---- the researcher ----
    const start = one('player');
    this.player = new Researcher(this, start.x, start.y).setDepth(5);
    this.carried = this.add.image(0, 0, 'tube').setDepth(6).setVisible(false);

    // ---- what touches what ----
    this.physics.add.collider(this.player, this.walls);
    this.physics.add.collider(this.player, this.freezer);
    this.physics.add.collider(this.carts, this.walls);
    this.physics.add.collider(this.carts, this.freezer);
    this.physics.add.collider(this.carts, this.carts);
    this.physics.add.collider(this.player, this.carts, this.bump, null, this);
    this.physics.add.overlap(this.player, this.sample, this.pickUp, null, this);
    this.physics.add.overlap(this.player, this.dropZone, this.deliver, null, this);
    this.physics.add.overlap(this.player, this.dryIce, this.grabDryIce, null, this);

    // ---- camera ----
    const cam = this.cameras.main;
    // leave room above the map for the HUD bar
    cam.setBounds(0, -44, map.widthInPixels, map.heightInPixels + 44);
    cam.startFollow(this.player, true, 0.12, 0.12);
    cam.fadeIn(300);

    // ---- feel ----
    this.trail = this.add.particles(0, 0, 'frost', {
      speed: { min: 5, max: 30 },
      lifespan: 700,
      scale: { start: 0.9, end: 0 },
      alpha: { start: 0.8, end: 0 },
      frequency: 80,
      emitting: false,
    });
    this.trail.startFollow(this.player, 0, -20).setDepth(4);
    this.burst = this.add.particles(0, 0, 'frost', {
      speed: { min: 60, max: 200 },
      lifespan: 800,
      scale: { start: 1.4, end: 0 },
      alpha: { start: 1, end: 0 },
      emitting: false,
    });
    this.burst.setDepth(7);

    // ---- input ----
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys('W,A,S,D');
    this.stick = this.sys.game.device.input.touch ? new TouchStick(this) : null;
    this.direction = new Phaser.Math.Vector2();

    // ---- tell the HUD ----
    this.registry.set({
      floor: this.floorIndex + 1,
      target: floor.deliveries,
      delivered: 0,
      carrying: false,
      thaw: 0,
      time: this.elapsed,
    });

    // tuning changes from the course pages (lesson 8)
    const onTune = (path) => {
      if (path === 'carts.speedScale') this.carts.getChildren().forEach((c) => this.setCartSpeed(c));
    };
    this.game.events.on('tuning-changed', onTune);
    this.events.once('shutdown', () => this.game.events.off('tuning-changed', onTune));
  }

  update(time, delta) {
    if (this.finished) return;

    this.elapsed += delta;
    this.registry.set('time', this.elapsed);

    // keyboard and touch both produce a direction
    const k = this.cursors;
    const w = this.wasd;
    this.direction.set(
      (k.right.isDown || w.D.isDown ? 1 : 0) - (k.left.isDown || w.A.isDown ? 1 : 0),
      (k.down.isDown || w.S.isDown ? 1 : 0) - (k.up.isDown || w.W.isDown ? 1 : 0),
    );
    if (this.direction.lengthSq() > 0) this.direction.normalize();
    else if (this.stick) this.direction.copy(this.stick.vector);

    const onSpill = this.physics.overlap(this.player, this.spills);
    this.player.walk(this.direction, onSpill);

    if (this.carrying) {
      this.carried.setPosition(this.player.x, this.player.y - 22);
      this.setThaw(this.thaw + (tuning.thaw.perSecond * delta) / 1000);
    }

    // carts keep moving along their own axis at their own speed
    this.carts.getChildren().forEach((cart) => {
      const v = cart.getData('axis') === 'x' ? cart.body.velocity.x : cart.body.velocity.y;
      if (Math.abs(v) < cart.getData('speed') * 0.5) this.setCartSpeed(cart, Math.sign(v) || 1);
    });
  }

  addCart(x, y, axis = 'x', speed = 100) {
    const cart = this.carts.create(x, y, 'cart').setDepth(4);
    cart.setData({ axis, speed });
    cart.setBounce(1).setCollideWorldBounds(true).setPushable(false);
    cart.body.setSize(28, 26).setOffset(2, 2);
    this.setCartSpeed(cart, Phaser.Math.RND.sign());
    return cart;
  }

  setCartSpeed(cart, sign) {
    const axis = cart.getData('axis');
    const current = axis === 'x' ? cart.body.velocity.x : cart.body.velocity.y;
    const s = (sign ?? (Math.sign(current) || 1)) * cart.getData('speed') * tuning.carts.speedScale;
    cart.setVelocity(axis === 'x' ? s : 0, axis === 'y' ? s : 0);
  }

  setThaw(value) {
    this.thaw = Phaser.Math.Clamp(value, 0, 100);
    this.registry.set('thaw', this.thaw);
    if (this.thaw >= tuning.thaw.warnAt && !this.warned) {
      this.warned = true;
      this.sound.play('warning');
    } else if (this.thaw < tuning.thaw.warnAt) {
      this.warned = false;
    }
    if (this.thaw >= 100) this.finish(false);
  }

  pickUp() {
    if (this.carrying) return;
    this.carrying = true;
    this.sample.disableBody(true, true);
    this.carried.setVisible(true).setScale(1);
    this.setThaw(0);
    this.registry.set('carrying', true);
    this.sound.play('pickup');
    if (tuning.feel.tweens) {
      this.tweens.add({ targets: this.carried, scale: { from: 1.8, to: 1 }, duration: 250, ease: 'Back.Out' });
    }
    if (tuning.feel.particles) this.trail.start();

    // a detour worth taking? (lesson 8)
    const spot = Phaser.Utils.Array.GetRandom(this.dryIceSpots);
    if (spot) this.dryIce.enableBody(true, spot.x, spot.y, true, true);
  }

  deliver() {
    if (!this.carrying) return;
    this.carrying = false;
    this.carried.setVisible(false);
    this.trail.stop();
    this.dryIce.disableBody(true, true);
    this.delivered += 1;
    this.registry.set({ carrying: false, delivered: this.delivered, thaw: 0 });
    this.sound.play('deliver');

    this.freezer.setFrame(1);
    this.time.delayedCall(450, () => this.freezer.setFrame(0));
    if (tuning.feel.shake) this.cameras.main.shake(140, 0.006);
    if (tuning.feel.particles) this.burst.explode(24, this.freezer.x, this.freezer.y);
    this.floatText(this.freezer.x, this.freezer.y - 40, `${this.delivered} / ${this.registry.get('target')}`, '#7dd3fc');

    if (this.delivered >= tuning.floors[this.floorIndex].deliveries) {
      this.nextFloor();
      return;
    }

    // harder every time (lesson 8)
    for (let i = 0; i < tuning.carts.extraPerDelivery; i++) {
      const spawn = Phaser.Utils.Array.GetRandom(this.cartSpawns);
      if (spawn) this.addCart(spawn.x, spawn.y, Phaser.Math.RND.pick(['x', 'y']), Phaser.Math.Between(90, 140));
    }
    this.time.delayedCall(400, () => this.sample.enableBody(true, this.sample.x, this.sample.y, true, true));
  }

  grabDryIce() {
    this.dryIce.disableBody(true, true);
    this.setThaw(this.thaw - tuning.thaw.dryIceBonus);
    this.sound.play('dryice');
    if (tuning.feel.particles) this.burst.explode(16, this.dryIce.x, this.dryIce.y);
    this.floatText(this.dryIce.x, this.dryIce.y - 24, 'COLDER', '#e0f2fe');
  }

  bump(player, cart) {
    if (this.invulnerable || this.finished) return;
    this.invulnerable = true;

    const away = new Phaser.Math.Vector2(player.x - cart.x, player.y - cart.y).normalize();
    player.setVelocity(away.x * tuning.carts.knockback, away.y * tuning.carts.knockback);
    this.sound.play('bump');
    player.setTint(0xff7b7b);
    this.time.delayedCall(150, () => player.clearTint());
    if (this.carrying) this.setThaw(this.thaw + tuning.thaw.bumpPenalty);

    if (tuning.feel.shake) this.cameras.main.shake(120, 0.01);
    if (tuning.feel.hitStopMs > 0) {
      this.physics.world.pause();
      this.time.delayedCall(tuning.feel.hitStopMs, () => this.physics.world.resume());
    }
    this.tweens.add({ targets: player, alpha: 0.35, duration: 90, yoyo: true, repeat: 4 });
    this.time.delayedCall(tuning.carts.invulnerableMs, () => {
      this.invulnerable = false;
      player.setAlpha(1);
    });
  }

  floatText(x, y, message, color) {
    const label = this.add
      .text(x, y, message, { fontFamily: 'monospace', fontSize: '18px', fontStyle: 'bold', color })
      .setOrigin(0.5)
      .setDepth(10)
      .setStroke('#0f172a', 4);
    this.tweens.add({ targets: label, y: y - 40, alpha: 0, duration: 900, ease: 'Cubic.Out', onComplete: () => label.destroy() });
  }

  nextFloor() {
    const next = this.floorIndex + 1;
    if (next >= tuning.floors.length) {
      this.finish(true);
      return;
    }
    this.finished = true;
    this.player.setAcceleration(0).setVelocity(0);
    this.cameras.main.fadeOut(500);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.restart({ floor: next, time: this.elapsed });
    });
  }

  finish(won) {
    if (this.finished) return;
    this.finished = true;
    this.physics.world.pause();
    this.trail.stop();
    this.player.anims.stop();
    this.sound.play(won ? 'win' : 'lose');
    if (!won) {
      this.carried.setTint(0x7c3aed);
      this.floatText(this.player.x, this.player.y - 40, 'THAWED', '#fca5a5');
    }
    this.time.delayedCall(1100, () => {
      this.scene.stop('Hud');
      this.scene.start('Results', { won, time: this.elapsed, floor: this.floorIndex + 1 });
    });
  }
}
