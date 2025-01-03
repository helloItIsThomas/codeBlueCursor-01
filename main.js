import * as dat from "dat.gui";

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
  const guiInterface = new dat.GUI();
  guiInterface.add(gui, "angleMult", 0, 200, 0.1);
  guiInterface.add(gui, "maxTravelDist", 0, 200, 0.1);

  sv.pApp = new Application();

  await sv.pApp.init({
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: 0x071134,
    resolution: 3,
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
      sv.pApp.screen.width * 0.5,
      sv.pApp.screen.height * 0.5,
      // (1 + Math.random() * 20) * 10
      10
    );
  }

  const cellW = 15;
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

class Triangle {
  constructor(i, x, y, speed) {
    this.id = i;
    this.x = x;
    this.y = y;
    this.newPos = { x: 0, y: 0 };
    this.speed = speed;
    this.alpha = 0.0;
    this.active = false;
    this.clock = 0;
    this.origin = {
      x: sv.pApp.screen.width * 0.5,
      y: sv.pApp.screen.height * 0.5,
    };
  }

  make() {
    console.log("make");
    this.active = true;
    this.alpha = 1.0;
    this.origin = {
      x: sv.mousePos.x,
      y: sv.mousePos.y,
    };
    this.newPos = {
      x: sv.mousePos.x,
      y: sv.mousePos.y,
    };
  }
  destroy() {
    // console.log("destroy");
    this.active = false;
    this.alpha = 0.0;
    this.clock = 0;
    this.newPos = {
      x: sv.pApp.screen.width * 0.5,
      y: sv.pApp.screen.height * 0.5,
    };
  }

  animate() {
    const angle = (this.id / sv.totalTriangles) * gui.angleMult * Math.PI * 2;
    this.clock += 0.05;
    const normDist = parseFloat((this.clock % 1.0).toFixed(2));
    const maxDist = gui.maxTravelDist;
    const dist = normDist * maxDist;

    // this.alpha = this.alpha + (normDist - this.alpha) * 0.1; // Lerp from current alpha to normDist
    this.alpha = 1 - normDist;
    if (this.id == 1) console.log(this.alpha);

    this.newPos = {
      x: Math.cos(angle) * dist + this.origin.x,
      y: Math.sin(angle) * dist + this.origin.y,
    };

    if (normDist === 0) {
      this.destroy();
    }
  }
}
