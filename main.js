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
  // const guiInterface = new dat.GUI();
  // guiInterface.add(gui, "angleMult", 0, 200, 0.1);
  // guiInterface.add(gui, "maxTravelDist", 0, 200, 0.1);

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

class Triangle {
  constructor(i, x, y, speed) {
    this.id = i;
    this.rand = Math.random() * (0.05 - 0.01) + 0.01;
    this.x = x;
    this.y = y;
    this.newPos = { x: 0, y: 0 };
    this.speed = speed;
    this.alpha = 0.0;
    this.active = false;
    this.origin = {
      x,
      y,
    };
  }

  make() {
    console.log("make");
    this.active = true;
    this.alpha = 1.0;
  }
  destroy() {
    console.log("destroy");
    this.active = false;
    this.alpha = 0.0;
  }

  animate() {
    const angle = (this.id / sv.totalTriangles) * gui.angleMult * Math.PI * 2;

    const vel = sv.clock * 50.0;

    this.newPos = {
      x: Math.cos(angle) * vel + this.origin.x,
      y: Math.sin(angle) * vel + this.origin.y,
    };

    // Wrap around the screen edges
    if (this.newPos.x < 0) {
      this.newPos.x += sv.pApp.screen.width;
    } else if (this.newPos.x > sv.pApp.screen.width) {
      this.newPos.x -= sv.pApp.screen.width;
    }

    if (this.newPos.y < 0) {
      this.newPos.y += sv.pApp.screen.height;
    } else if (this.newPos.y > sv.pApp.screen.height) {
      this.newPos.y -= sv.pApp.screen.height;
    }

    this.distance = Math.sqrt(
      Math.pow(this.newPos.x - sv.mousePos.x, 2) +
        Math.pow(this.newPos.y - sv.mousePos.y, 2)
    );
    this.normalizedDistance =
      this.distance /
      Math.sqrt(
        Math.pow(sv.pApp.screen.width, 2) + Math.pow(sv.pApp.screen.height, 2)
      );

    if (1.0 - this.normalizedDistance > 0.95) {
      if (this.active != true) {
        this.make();
      }
    }

    this.alpha = Math.max(0, this.alpha - this.rand);
    if (this.alpha < 0.2 && this.active == true) {
      this.destroy();
    }
  }
}
