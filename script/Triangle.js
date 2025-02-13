import { sv } from "./variables.js";
import { gui } from "./variables.js";

export class Triangle {
  constructor(i, x, y, speed) {
    this.id = i;
    this.rand = Math.random() * (0.05 - 0.01) + 0.01;
    this.x = x;
    this.y = y;
    this.pos = { x: 0, y: 0 };
    this.speed = speed;
    this.clock = 0;
    this.alpha = 0.0;
    this.active = false;
    this.origin = { x, y };
    this.maxRadius = 100;
    this.fadeSpeed = Math.random() * 0.005 + 0.005;
    this.size = Math.random() * 0.5 + 0.5;
  }

  make() {
    this.active = true;
    this.alpha = 1.0;
    this.clock = 0;
    this.pos.x = this.origin.x;
    this.pos.y = this.origin.y;
    this.initialAngle = Math.random() * Math.PI * 2;
  }

  destroy() {
    this.active = false;
    this.alpha = 0.0;
    this.clock = 0;
  }

  animate() {
    if (!this.active) {
      this.pos.x = this.origin.x;
      this.pos.y = this.origin.y;
      this.alpha = 0;
      return;
    }

    const angleJitter = Math.sin(this.clock * 10) * 0.02;
    const angle = this.initialAngle + angleJitter;
    const vel = Math.pow(this.clock, 0.7) * 60.0;

    this.pos = {
      x: Math.cos(angle) * vel + this.origin.x,
      y: Math.sin(angle) * vel + this.origin.y,
    };

    const distFromOrigin = Math.sqrt(
      Math.pow(this.pos.x - this.origin.x, 2) +
        Math.pow(this.pos.y - this.origin.y, 2)
    );

    if (distFromOrigin > this.maxRadius) {
      this.destroy();
      return;
    }

    const fadeStart = this.maxRadius * 0.3;
    if (distFromOrigin > fadeStart) {
      const fadeFactor =
        1 - (distFromOrigin - fadeStart) / (this.maxRadius - fadeStart);
      this.alpha = Math.max(0, fadeFactor * Math.exp(-this.clock * 20));
    } else {
      this.alpha = Math.exp(-this.clock * 20);
    }

    if (this.active) {
      this.clock += this.fadeSpeed;
    }
  }
}
