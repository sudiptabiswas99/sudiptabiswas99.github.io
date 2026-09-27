/* Verlet lanyard for the hero badge: pivot → strap end → card ring → card foot. Pure math, no DOM.
   From ~/Documents/hanging-card/js/lib/rig.js, plus the reel: the strap can be pulled up into the mount and
   let go, so the card drops in. Lengths in px, time in seconds, angles in radians (0 = straight down,
   positive = the lower point sits to the right of the upper one). */

export const STEP = 1 / 120
const ITERATIONS = 8

const point = (x, y, w) => ({ x, y, ox: x, oy: y, w })
const place = (p, x, y) => { p.x = p.ox = x; p.y = p.oy = y }
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a))

export class Rig {
  constructor(tuning) {
    this.tuning = tuning
    this.scale = 1
    this.acc = 0
    this.grab = null
    this.pts = null
    this.lengths = [0, 0, 0]
    this.reel = null
  }

  // Hang the chain from (x, y). Keeps the current angles if the rig already exists.
  configure(x, y, lengths, scale) {
    const angles = this.pts ? [this.angle(0), this.angle(2)] : [0, 0]
    this.lengths = lengths
    this.scale = scale
    this.pts = [point(x, y, 0), point(x, y, 3), point(x, y, 1), point(x, y, 1)]
    this.pose(...angles)
  }

  // Put the chain at the given angles, at rest.
  pose(strapAngle, cardAngle) {
    const [p0, p1, p2, p3] = this.pts
    const [strap, clip, card] = this.lengths
    place(p1, p0.x + Math.sin(strapAngle) * strap, p0.y + Math.cos(strapAngle) * strap)
    place(p2, p1.x + Math.sin(strapAngle) * clip, p1.y + Math.cos(strapAngle) * clip)
    place(p3, p2.x + Math.sin(cardAngle) * card, p2.y + Math.cos(cardAngle) * card)
  }

  angle(i) {
    const a = this.pts[i], b = this.pts[i + 1]
    return Math.atan2(b.x - a.x, b.y - a.y)
  }

  velocity(i) {
    const p = this.pts[i]
    return { x: (p.x - p.ox) / STEP, y: (p.y - p.oy) / STEP }
  }

  // Where (x, y) falls along the card: 0 at the ring, 1 at the foot.
  along(x, y) {
    const [, , a, b] = this.pts
    const len = this.lengths[2]
    const t = ((x - a.x) * (b.x - a.x) + (y - a.y) * (b.y - a.y)) / (len * len)
    return Math.min(1, Math.max(0, t))
  }

  // Pointer in card space: x from −1 (left edge) to 1 (right edge), y from 0 (ring) to 1 (foot).
  local(x, y, halfWidth) {
    const [, , a, b] = this.pts
    const len = this.lengths[2]
    const ux = (b.x - a.x) / len, uy = (b.y - a.y) / len
    const dx = x - a.x, dy = y - a.y
    return { x: (dx * uy - dy * ux) / halfWidth, y: (dx * ux + dy * uy) / len }
  }

  // Pull the strap into the mount until `share` of it shows, and hold it there until letGo().
  reelIn(share) {
    const full = this.reel ? this.reel.full : this.lengths[0]
    this.reel = { full, v: 0, held: true, caught: false }
    this.lengths[0] = full * share
  }
  letGo() { if (this.reel) this.reel.held = false }

  hold(t, x, y) { this.grab = { t, x, y } }
  release() { this.grab = null }

  // Add sideways speed (px/s), strongest at the foot.
  push(vx) {
    const weights = [0, 0.45, 0.75, 1]
    this.pts.forEach((p, i) => { p.ox -= vx * weights[i] * STEP })
  }

  update(dt) {
    this.acc = Math.min(this.acc + dt, 0.1)
    while (this.acc >= STEP) {
      this.tick(STEP)
      this.acc -= STEP
    }
  }

  tick(h) {
    const { gravity, damping, maxSpeed } = this.tuning
    if (this.reel && !this.reel.held) this.runOut(h, gravity * this.scale)
    const keep = Math.pow(damping, h)
    const limit = maxSpeed * this.scale * h
    const fall = gravity * this.scale * h * h
    for (const p of this.pts) {
      if (!p.w) continue
      let vx = (p.x - p.ox) * keep
      let vy = (p.y - p.oy) * keep
      const speed = Math.hypot(vx, vy)
      if (speed > limit) { vx *= limit / speed; vy *= limit / speed }
      p.ox = p.x; p.oy = p.y
      p.x += vx; p.y += vy + fall
    }
    for (let i = 0; i < ITERATIONS; i++) {
      this.solveGrab()
      this.solveSwing()
      this.solveBend(0)
      this.solveBend(1)
      this.solveLinks()
    }
  }

  // The let-go strap: slack, it falls freely; taut, it stretches like elastic, catches the card and bounces
  // it until it hangs at full length. Its natural length is set so the rest point is exactly `full`.
  runOut(h, g) {
    const r = this.reel, { stiffness, damping } = this.tuning.drop
    const len = this.lengths[0], slack = r.full - g / stiffness
    const a = len < slack ? g : g - stiffness * (len - slack) - damping * r.v
    r.v += a * h
    this.lengths[0] = len + r.v * h
    if (this.lengths[0] >= r.full) r.caught = true
    if (Math.abs(this.lengths[0] - r.full) < 0.1 * this.scale && Math.abs(r.v) < 3 * this.scale) {
      this.lengths[0] = r.full
      this.reel = null
    }
  }

  // Pull the held spot toward the pointer, split between ring and foot like a lever.
  solveGrab() {
    if (!this.grab) return
    const { t, x, y } = this.grab
    const [, , a, b] = this.pts
    const gx = a.x + (b.x - a.x) * t, gy = a.y + (b.y - a.y) * t
    const k = this.tuning.grip / ((1 - t) ** 2 + t ** 2)
    const dx = (x - gx) * k, dy = (y - gy) * k
    a.x += dx * (1 - t); a.y += dy * (1 - t)
    b.x += dx * t; b.y += dy * t
  }

  // The strap cannot swing up past the rail.
  solveSwing() {
    const max = this.tuning.maxSwing
    const a = this.angle(0)
    if (Math.abs(a) <= max) return
    const [p0, p1] = this.pts
    const target = Math.sign(a) * max
    p1.x = p0.x + Math.sin(target) * this.lengths[0]
    p1.y = p0.y + Math.cos(target) * this.lengths[0]
  }

  // Segment i+1 may bend at most maxBend away from segment i (the clip joints are stiff).
  solveBend(i) {
    const own = this.angle(i + 1)
    const diff = wrap(own - this.angle(i))
    const max = this.tuning.maxBend
    if (Math.abs(diff) <= max) return
    const b = this.pts[i + 1], c = this.pts[i + 2]
    const target = own - diff + Math.sign(diff) * max
    const len = this.lengths[i + 1]
    c.x = b.x + Math.sin(target) * len
    c.y = b.y + Math.cos(target) * len
  }

  solveLinks() {
    for (let i = 0; i < 3; i++) {
      const a = this.pts[i], b = this.pts[i + 1]
      const dx = b.x - a.x, dy = b.y - a.y
      const dist = Math.hypot(dx, dy) || 1e-6
      const k = (dist - this.lengths[i]) / (dist * (a.w + b.w))
      a.x += dx * k * a.w; a.y += dy * k * a.w
      b.x -= dx * k * b.w; b.y -= dy * k * b.w
    }
  }
}
