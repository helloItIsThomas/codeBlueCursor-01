import * as dat from "dat.gui";
import { Triangle } from "./script/Triangle.js";

import {
  Application,
  Assets,
  Buffer,
  BufferUsage,
  Container,
  Geometry,
  Mesh,
  Point,
  Shader,
  Sprite,
  Texture,
} from "pixi.js";
import { BlurFilter } from "pixi.js";
import { BloomFilter } from "pixi-filters/bloom";
import { ConvolutionFilter } from "pixi-filters/convolution";
import { DisplacementFilter } from "pixi.js";
import { GlowFilter } from "pixi-filters/glow";
import { ShockwaveFilter } from "pixi-filters/shockwave";

import { sv } from "./script/variables.js";
import { gui } from "./script/variables.js";
import { loadShaders } from "./script/loadShaders.js";
import { render } from "./script/render.js";

sv.mousePos = { x: 0, y: 0 };
sv.prevMousePos = { x: 0, y: 0 };

async function mySetup() {
  // const guiInterface = new dat.GUI();
  // guiInterface.add(gui, "angleMult", 0, 200, 0.1);
  // guiInterface.add(gui, "maxTravelDist", 0, 200, 0.1);

  sv.pApp = new Application();

  await sv.pApp.init({
    width: window.innerWidth,
    height: window.innerHeight,
    // backgroundColor: 0x071134,
    backgroundColor: 0x000000,
    resolution: 3,
    resizeTo: window,
  });
  document.body.appendChild(sv.pApp.canvas);

  const spinnyBG = await Assets.load("/assets/dot2.png");

  const { vertex, fragment } = await loadShaders();

  // need a buffer big enough to store x, y of sv.totalTriangles
  const instancePositionBuffer = new Buffer({
    data: new Float32Array(sv.totalTriangles * 2),
    usage: BufferUsage.VERTEX | BufferUsage.COPY_DST,
  });

  const alphaBuffer = new Buffer({
    data: new Float32Array(sv.totalTriangles),
    usage: BufferUsage.VERTEX | BufferUsage.COPY_DST,
  });

  sv.triangles = [];

  for (let i = 0; i < sv.totalTriangles; i++) {
    sv.triangles[i] = new Triangle(
      i,
      Math.random() * sv.pApp.screen.width,
      Math.random() * sv.pApp.screen.height,
      Math.random() * 0.05
    );
  }

  const cellW = 5;
  const cellH = cellW;
  const geometry = new Geometry({
    topology: "triangle-strip",
    instanceCount: sv.totalTriangles,
    attributes: {
      aPosition: [
        0.0,
        0.0,
        cellW,
        0.0,
        cellW,
        cellH,
        cellW,
        cellH,
        0.0,
        cellH,
        0.0,
        0.0,
      ],
      aUV: [0, 0, 1, 0, 1, 1, 1, 1, 0, 1, 0, 0],
      aPositionOffset: {
        buffer: instancePositionBuffer,
        instance: true,
      },
      aAlpha: {
        buffer: alphaBuffer,
        instance: true,
      },
    },
  });

  const gl = { vertex, fragment };

  const shader = Shader.from({
    gl,
    resources: {
      myTexture: spinnyBG.source,
      uSampler: spinnyBG.source.style,
      waveUniforms: {
        mouseVelocity: { value: 0.5, type: "f32" },
        mousePos: { value: sv.mousePos, type: "vec2<f32>" },
        time: { value: sv.pApp.ticker.lastTime, type: "f32" },
      },
    },
  });

  const triangleMesh = new Mesh({
    geometry,
    shader,
  });

  const container = new Container();
  container.width = sv.pApp.screen.width;
  container.height = sv.pApp.screen.height;
  container.filterArea = sv.pApp.screen;

  // try glow, displacement, convolution?, shockwave?,
  container.filters = [
    new BloomFilter({
      strength: 10,
      quality: 5,
      kernelSize: 7,
    }),
    new GlowFilter({
      color: 0x64f0f5,
      distance: 1,
      innerStrength: 0,
      outerStrength: 2.0,
    }),
    // new ConvolutionFilter({
    // matrix: [0, 1, 0, 1, -2, 1, -0.5, 2, 0],
    // }),
    // new DisplacementFilter({
    // sprite: displacementSprite,
    // scale: 150,
    // }),
    // new BlurFilter({ strength: 2 }),
  ];

  container.addChild(triangleMesh);
  sv.pApp.stage.addChild(container);

  sv.pApp.ticker.add(() => {
    sv.clock = sv.pApp.ticker.lastTime * 0.001;
    render(instancePositionBuffer, alphaBuffer, triangleMesh);
  });
}

window.addEventListener("load", () => {
  mySetup();
});

window.addEventListener("mousemove", (event) => {
  sv.prevMousePos.x = sv.mousePos.x;
  sv.prevMousePos.y = sv.mousePos.y;
  sv.mousePos.x = event.clientX;
  sv.mousePos.y = event.clientY;
});
