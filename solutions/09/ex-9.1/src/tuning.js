// Every number that changes how Cold Chain plays, in one place.
// Change these, not the code in the scenes. (Lesson 8)

export const tuning = {
  player: {
    maxSpeed: 220, // pixels per second
    acceleration: 1400, // how fast you reach max speed
    drag: 1800, // how fast you stop on a dry floor
    spillDrag: 90, // ...and on a spill
    spillMaxSpeed: 300,
  },
  thaw: {
    perSecond: 7, // the meter fills from 0 to 100
    bumpPenalty: 15, // added when a cart hits you
    dryIceBonus: 40, // taken off when you grab dry ice
    warnAt: 75,
  },
  carts: {
    speedScale: 1, // multiplies every cart's speed from the map
    extraPerDelivery: 1, // carts added after each delivery
    knockback: 320,
    invulnerableMs: 900,
  },
  floors: [
    { map: 'floor-1', deliveries: 3 },
    { map: 'floor-2', deliveries: 3 },
  ],
  feel: {
    shake: true,
    particles: true,
    tweens: true,
    hitStopMs: 70,
  },
};
