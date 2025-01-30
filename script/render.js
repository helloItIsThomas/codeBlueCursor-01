import { sv } from "./variables.js";

let lastMakeTime = 0;

const VELOCITY_THRESHOLD = 10;
const MAKE_COOLDOWN = 8;
const PARTICLES_PER_SPAWN = 1;

export function render(instancePositionBuffer, alphaBuffer, triangleMesh) {
  const data = instancePositionBuffer.data;
  const alphaData = alphaBuffer.data;

  const mouseVelocity = Math.abs(
    Math.sqrt(
      Math.pow(sv.mousePos.x - sv.prevMousePos.x, 2) +
        Math.pow(sv.mousePos.y - sv.prevMousePos.y, 2)
    )
  );

  const currentTime = Date.now();
  if (mouseVelocity > VELOCITY_THRESHOLD && currentTime - lastMakeTime > MAKE_COOLDOWN) {
    const inactiveTriangles = sv.triangles.filter(t => !t.active);
    
    for (let i = 0; i < PARTICLES_PER_SPAWN && i < inactiveTriangles.length; i++) {
      const triangle = inactiveTriangles[i];
      const offset = {
        x: (Math.random() - 0.5) * 10,
        y: (Math.random() - 0.5) * 10
      };
      triangle.origin.x = sv.mousePos.x + offset.x;
      triangle.origin.y = sv.mousePos.y + offset.y;
      triangle.make();
    }
    lastMakeTime = currentTime;
  }

  triangleMesh.shader.resources.waveUniforms.uniforms.mouseVelocity = mouseVelocity;
  triangleMesh.shader.resources.waveUniforms.uniforms.mousePos = {
    x: sv.mousePos.x / window.innerWidth,
    y: sv.mousePos.y / window.innerHeight,
  };

  sv.triangles.forEach((triangle) => {
    triangle.animate();
    data[triangle.id * 2] = triangle.pos.x;
    data[triangle.id * 2 + 1] = triangle.pos.y;
    alphaData[triangle.id] = triangle.alpha;
  });
  
  instancePositionBuffer.update();
  alphaBuffer.update();

  sv.prevMousePos.x = sv.mousePos.x;
  sv.prevMousePos.y = sv.mousePos.y;
}
