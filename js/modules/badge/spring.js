/* Damped spring toward a target. Steps at 120 Hz inside, so large frame gaps stay stable.
   Copied unchanged from ~/Documents/hanging-card/js/lib/spring.js. */
const STEP = 1 / 120

export class Spring {
  constructor({ stiffness, damping }, value = 0) {
    this.stiffness = stiffness
    this.damping = damping
    this.value = value
    this.target = value
    this.velocity = 0
    this.acc = 0
  }

  update(dt) {
    this.acc = Math.min(this.acc + dt, 0.1)
    while (this.acc >= STEP) {
      const force = -this.stiffness * (this.value - this.target) - this.damping * this.velocity
      this.velocity += force * STEP
      this.value += this.velocity * STEP
      this.acc -= STEP
    }
    return this.value
  }
}
