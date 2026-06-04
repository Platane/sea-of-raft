import { mat4, vec4 } from "gl-matrix";
import { boxes, getSpriteSheet } from "./engine/sprites";
import { createRenderer } from "./renderer";

// import "./scripts/generateTileSet";

const canvas = document.getElementById("main-canvas") as HTMLCanvasElement;

const renderer = createRenderer(canvas, {
  spriteSheet: await getSpriteSheet(),
});

renderer.entities.count = 2;
vec4.copy(renderer.entities.items[0].spriteBox, boxes.pirates[0]);
mat4.identity(renderer.entities.items[0].transform);

mat4.lookAt(renderer.viewMatrix, [1, 5, 5], [0, 0, 0], [0, 1, 0]);

window.onresize = () =>
  renderer.resize(window.innerWidth, window.innerHeight, Math.min(window.devicePixelRatio ?? 1, 2));
(window as any).onresize();

const loop = () => {
  vec4.copy(renderer.entities.items[1].spriteBox, boxes.pirates[1]);
  mat4.identity(renderer.entities.items[1].transform);
  mat4.translate(renderer.entities.items[1].transform, renderer.entities.items[1].transform, [
    Math.sin(Date.now() / 1000) * 3,
    0,
    0,
  ]);

  renderer.draw();

  requestAnimationFrame(loop);
};
loop();
