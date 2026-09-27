/* One hanging badge: wraps the .badge already in index.html. A Verlet rig swings it, springs drive flip,
   twist, hover tilt and lift. Adapted from ~/Documents/hanging-card/js/modules/badge.js. Input is in pointer.js;
   index.js owns the frame loop: every input calls wake(), and resting() tells the loop when it may stop. */
import { Rig } from './rig.js';
import { Spring } from './spring.js';
import { bindPointer } from './pointer.js';

/* tuning, copied from hanging-card js/lib/badge-data.js */
export const PHYSICS = {
  gravity: 14000,     // px/s² at scale 1
  damping: 0.1,       // share of speed kept after one second (0.2 in hanging-card; 0.1 settles the entrance in ~5 s)
  maxSpeed: 5200,     // px/s at scale 1
  maxSwing: 1.45,     // rad, strap limit either side of vertical
  maxBend: 0.5,       // rad, how far each clip joint can fold
  grip: 0.24,         // how hard the pointer pulls per solver pass
  swayKick: 1650,     // px/s an arrow key adds at the foot
  twist: 0.011,       // deg of turn per px/s of sideways speed
  maxTwist: 20,       // deg
  tilt: 11,           // deg of hover tilt at the card edge
  drop: { stiffness: 300, damping: 12 },   // the strap catching the card: 1/s², 1/s (dips ~27%, bounces twice)
  reelIn: 0.12,       // share of the strap left showing while the card waits up at the mount
  spinKick: 400,      // deg/s of turn the catch gives the card (measured peak ~30 deg)
  spinSpring: { stiffness: 49, damping: 5.2 },   // the card turning on its strap, about 0.9 s a swing
  flipSpring: { stiffness: 110, damping: 11 },
  tiltSpring: { stiffness: 170, damping: 17 },
  liftSpring: { stiffness: 260, damping: 26 },
};

const REST_SPEED = 4;     // px/s: a rig point slower than this counts as still (sub-pixel drift, invisible)
const REST_GAP = 0.02;    // deg (lift: share of full lift) a spring may still be off its target
const REST_DRIFT = 0.2;   // deg/s (lift: share per s) a spring may still be moving

const DEG = 180 / Math.PI;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export class Badge {
  constructor(el, size, wake) {
    this.el = el;
    this.size = size;
    this.wake = wake || function(){};
    const q = (s) => el.querySelector(s);
    this.parts = {
      shadow: q('.badge__shadow'), strap: q('.badge__strap'), mount: q('.badge__mount'),
      clip: q('.badge__clip'), card: q('.badge__card'), inner: q('.badge__inner'),
      text: q('.badge__strap-text'),
    };
    this.parts.text.style.transformOrigin = '50% 0';
    this.scale = 1;
    this.rig = new Rig(PHYSICS);
    this.yaw = new Spring(PHYSICS.flipSpring);
    this.tiltX = new Spring(PHYSICS.tiltSpring);
    this.tiltY = new Spring(PHYSICS.tiltSpring);
    this.lift = new Spring(PHYSICS.liftSpring);
    this.spin = new Spring(PHYSICS.spinSpring);
    this.springs = [this.yaw, this.tiltX, this.tiltY, this.lift, this.spin];
    this.kick = 0;
    this.flipped = false;
    this.drag = null;
    this.hover = null;
    bindPointer(this);
  }

  hang(x, y, scale) {
    const { strap, clip, cardH, ring } = this.size;
    const rig = this.rig, lengths = [strap * scale, clip * scale, (cardH - ring) * scale];
    if (rig.pts) {
      // re-hang without stopping the swing: move and resize the chain about its pivot, speeds included
      const [p0] = rig.pts, k = scale / this.scale, px = p0.x, py = p0.y;
      for (const p of rig.pts) {
        p.x = x + (p.x - px) * k; p.y = y + (p.y - py) * k;
        p.ox = x + (p.ox - px) * k; p.oy = y + (p.oy - py) * k;
      }
      const r = rig.reel;
      if (r) {
        // mid-drop: keep the strap's share, at the new size
        const k0 = lengths[0] / r.full;
        r.full = lengths[0]; r.v *= k0; lengths[0] = rig.lengths[0] * k0;
      }
      rig.lengths = lengths;
      rig.scale = scale;
    } else {
      rig.configure(x, y, lengths, scale);
    }
    this.scale = scale;
    this.textTop = this.parts.text.offsetTop;
    this.parts.mount.style.transform = `translate3d(${x}px, ${y - 8 * scale}px, 0) scale(${scale})`;
    this.render();
  }

  // Pull the card up to the mount and hold it there, straight, until drop(). Done while it is out of sight.
  arm() {
    if (this.drag) return;
    this.rig.reelIn(PHYSICS.reelIn);
    this.rig.pose(0, 0);
    this.kick = 0;
    this.spin.value = this.spin.velocity = 0;
    this.render();
  }
  armed() { return !!(this.rig.reel && this.rig.reel.held); }

  // Let it fall from a small side angle: the strap catches it, it bounces, turns on the strap and settles.
  drop(angle) {
    if (!this.armed()) return;
    this.rig.pose(angle * 0.8, angle);
    this.rig.letGo();
    this.kick = angle > 0 ? -1 : 1;
    this.render();
    this.wake();
  }

  flip(state = !this.flipped) {
    this.flipped = state;
    this.el.dispatchEvent(new CustomEvent('badgeflip', { bubbles: true }));
    this.wake();
  }

  sway(direction) {
    this.rig.push(direction * PHYSICS.swayKick * this.scale);
    this.wake();
  }

  update(dt) {
    if (this.drag && this.drag.live) this.rig.hold(this.drag.t, this.drag.x, this.drag.y);
    this.rig.update(dt);
    if (this.kick && !(this.rig.reel && !this.rig.reel.caught)) {
      // the catch jolts the card round on its strap
      this.spin.velocity += this.kick * PHYSICS.spinKick;
      this.kick = 0;
    }
    const speed = this.rig.velocity(3).x / this.scale;
    const twist = clamp(-speed * PHYSICS.twist, -PHYSICS.maxTwist, PHYSICS.maxTwist);
    this.yaw.target = (this.flipped ? 180 : 0) + twist;
    this.tiltX.target = this.hover ? (1 - this.hover.y * 2) * PHYSICS.tilt * 0.7 : 0;
    this.tiltY.target = this.hover ? this.hover.x * PHYSICS.tilt : 0;
    this.lift.target = this.drag && this.drag.live ? 1 : 0;
    for (const s of this.springs) s.update(dt);
    this.render();
  }

  // True when nothing is held, every rig point is slower than REST_SPEED and every spring has arrived.
  resting() {
    if (this.drag || this.kick || (this.rig.reel && !this.rig.reel.held)) return false;
    for (let i = 1; i < 4; i++) {
      const v = this.rig.velocity(i);
      if (Math.hypot(v.x, v.y) > REST_SPEED) return false;
    }
    return this.springs.every((s) => Math.abs(s.velocity) < REST_DRIFT && Math.abs(s.value - s.target) < REST_GAP);
  }

  render() {
    const { rig, parts, scale: s, size } = this;
    const [p0, p1, p2] = rig.pts;
    const cardDeg = -rig.angle(2) * DEG;
    const lift = this.lift.value;
    const turn = this.yaw.value + this.tiltY.value + this.spin.value;
    const x = p2.x - size.cardW / 2, y = p2.y - size.ring;

    // the strap shows at its current length: it slides out of the mount, its print moving with it, unsquashed
    const k = rig.reel ? rig.lengths[0] / rig.reel.full : 1;
    parts.strap.style.transform = `translate3d(${p0.x}px, ${p0.y}px, 0) rotate(${-rig.angle(0) * DEG}deg) scale(${s}, ${s * k})`;
    if (k !== this.strapK) {
      const t0 = this.textTop, full = size.strap;
      parts.text.style.transform = k === 1 ? '' : `translate(-50%, ${(t0 - full + full * k) / k - t0}px) scaleY(${1 / k})`;
      this.strapK = k;
    }
    parts.clip.style.transform = `translate3d(${p1.x}px, ${p1.y}px, 0) rotate(${-rig.angle(1) * DEG}deg) scale(${s})`;
    parts.card.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${cardDeg}deg) scale(${s * (1 + lift * 0.035)})`;
    parts.inner.style.transform = `rotateX(${this.tiltX.value}deg) rotateY(${turn}deg)`;
    // hide the face pointing away ourselves; WebKit ignores backface-visibility here
    const back = Math.cos(turn / DEG) < 0;
    if (back !== this.showingBack) this.el.classList.toggle('is-back', (this.showingBack = back));

    const width = Math.max(0.06, Math.abs(Math.cos(turn / DEG)));
    const dx = (10 + lift * 16) * s, dy = (24 + lift * 34) * s;
    parts.shadow.style.transform =
      `translate3d(${x + dx}px, ${y + dy}px, 0) rotate(${cardDeg}deg) scale(${s * width}, ${s})`;
    parts.shadow.style.opacity = 1 - lift * 0.3;
    parts.card.style.setProperty('--rx', this.tiltX.value.toFixed(2));
    parts.card.style.setProperty('--ry', (turn - (this.flipped ? 180 : 0)).toFixed(2));
  }
}
