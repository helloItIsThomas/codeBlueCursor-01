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
    this.origin = {
      x,
      y,
    };
  }

  make() {
    this.active = true;
    this.alpha = 1.0;
  }
  destroy() {
    this.active = false;
    this.clock = 0.0;
    //     this.alpha = 0.0;
  }

  animate() {
    const angle = (this.id / sv.totalTriangles) * gui.angleMult * Math.PI * 2;

    const vel = sv.clock * 150.0;

    this.pos = {
      x: Math.cos(angle) * vel + this.origin.x,
      y: Math.sin(angle) * vel + this.origin.y,
    };

    // Correct wrapping logic to ensure dots never leave the scene
    this.pos.x = (this.pos.x + sv.pApp.screen.width) % sv.pApp.screen.width;
    this.pos.y = (this.pos.y + sv.pApp.screen.height) % sv.pApp.screen.height;

    this.distance = Math.sqrt(
      Math.pow(this.pos.x - sv.mousePos.x, 2) +
        Math.pow(this.pos.y - sv.mousePos.y, 2)
    );
    this.normalizedDistance =
      this.distance /
      Math.sqrt(
        Math.pow(sv.pApp.screen.width, 2) + Math.pow(sv.pApp.screen.height, 2)
      );

    const cursorPushDistance = -20; // Distance to push triangles towards the cursor

    const angleToMouse = Math.atan2(
      sv.mousePos.y - this.pos.y,
      sv.mousePos.x - this.pos.x
    );
    this.pos.x +=
      Math.cos(angleToMouse) *
      cursorPushDistance *
      (1.0 - this.normalizedDistance);
    this.pos.y +=
      Math.sin(angleToMouse) *
      cursorPushDistance *
      (1.0 - this.normalizedDistance);

    // Reapply wrapping after cursor push
    this.pos.x = (this.pos.x + sv.pApp.screen.width) % sv.pApp.screen.width;
    this.pos.y = (this.pos.y + sv.pApp.screen.height) % sv.pApp.screen.height;

    if (1.0 - this.normalizedDistance > 0.95) {
      if (this.active != true) {
        this.make();
        console.log("make");
      }
    }

    if (this.active == true) {
      this.clock += 0.0025;
    }

    this.alpha = Math.max(0, this.alpha - this.clock);
    if (this.alpha <= 0.0 && this.active == true) {
      this.destroy();
    }
  }
}
