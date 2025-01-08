import { Point } from "pixi.js";
import { sv } from "./variables.js";

let makeIndex = 0;
export function render(instancePositionBuffer, alphaBuffer, triangleMesh) {
  const data = instancePositionBuffer.data;
  const alphaData = alphaBuffer.data;

  const mouseVelocity = Math.abs(
    Math.sqrt(
      Math.pow(sv.mousePos.x - sv.prevMousePos.x, 2) +
        Math.pow(sv.mousePos.y - sv.prevMousePos.y, 2)
    )
  );

  const normMouseVel = mouseVelocity / window.innerWidth;
  const normMousePos = {
    x: sv.mousePos.x / window.innerWidth,
    y: sv.mousePos.y / window.innerHeight,
  };

  triangleMesh.shader.resources.waveUniforms.uniforms.mouseVelocity =
    normMouseVel;
  triangleMesh.shader.resources.waveUniforms.uniforms.mousePos = normMousePos;

  sv.triangles.forEach((triangle) => {
    triangle.animate();
    data[triangle.id * 2] = triangle.newPos.x;
    data[triangle.id * 2 + 1] = triangle.newPos.y;
    alphaData[triangle.id] = triangle.alpha;
  });
  instancePositionBuffer.update();
  alphaBuffer.update();

  sv.prevMousePos.x = sv.mousePos.x;
  sv.prevMousePos.y = sv.mousePos.y;
}
