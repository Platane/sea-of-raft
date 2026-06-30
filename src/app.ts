import { mat4 } from "gl-matrix";
import { createRenderer } from "./renderer";
import { createTimeline } from "./ui/timeline";
import { createReplayer, type Replayer } from "./replayer";
import { loadImage } from "./utils/image";
import { tileSetUrl } from "./scripts/generateTileSet";
import { createStepper, createWorld } from "./engine";
import { staggered } from "./engine/systems/nodes/scheduler";
import { updateNode_hotPotato } from "./engine/systems/nodes/algs/hotPotato";
import type { UpdateNode } from "./engine/systems/nodes/type";
import type { ID, World } from "./engine/type";
import { updateEntities } from "./engine/systems/rendererEntities";
import { createOrbitControl } from "./ui/orbitcontrol";
import { createNoiseRenderer } from "./renderer/noise";
import { setNoiseData } from "./sea/height";

// import tileSetUrl from "./assets/tileset.png";
import waveUrl from "./assets/waves.png";

const canvas = document.getElementById("main-canvas") as HTMLCanvasElement;

const renderer = createRenderer(canvas, {
  spriteSheet: await loadImage(tileSetUrl),
  wave: await loadImage(waveUrl),
  noise: (() => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 512;
    const gl = canvas.getContext("webgl2", { preserveDrawingBuffer: true })!;
    const noiseRenderer = createNoiseRenderer(gl);
    noiseRenderer.draw({ resolution: [4, 4], offset: [0, 0] });

    const rgba = new Uint8Array(canvas.width * canvas.height * 4);
    gl.readPixels(0, 0, canvas.width, canvas.height, gl.RGBA, gl.UNSIGNED_BYTE, rgba);

    const viewer = document.createElement("div");
    viewer.style = `position:fixed;top:0;right:0;border:solid 5px red;width:200px;aspect-ratio:1;background:url(${canvas.toDataURL()});background-size:100px 100px;`;
    document.body.appendChild(viewer);

    noiseRenderer.dispose();

    return canvas;
  })(),
});

window.onresize = () =>
  renderer.resize(window.innerWidth, window.innerHeight, Math.min(window.devicePixelRatio ?? 1, 2));
(window as any).onresize();

//
// ui
//
{
  const eye = [1, 5, 10];
  const lookAt = [0, 0, 0];
  const up = [0, 1, 0];
  const update = () => mat4.lookAt(renderer.viewMatrix, eye, lookAt, up);
  update();
  createOrbitControl({ canvas }, { eye, lookAt }, update, {
    minRadius: 6,
    maxRadius: 24,
    minPhi: Math.PI * 0.02,
    maxPhi: Math.PI * 0.25,
  });
}

const timeline = createTimeline();
document.body.appendChild(timeline.domElement);
timeline.domElement.id = "timeline";

//
// machine
//

export type Action =
  | { type: "tic" }
  | { type: "crash"; node: ID; duration: number }
  | { type: "isolate"; node: ID; duration: number };

// an alg pins its own message/storage shape; erase it to the generic node
// contract at the wiring boundary
const step = createStepper(updateNode_hotPotato as UpdateNode, staggered, renderer.viewMatrix);
const replayer = createReplayer<World, Action>((world, action) => {
  if (action.type === "tic") step(world);
  return world;
});
let r: Replayer<World, Action> = {
  state: createWorld(5),
  index: 0,
  snapshots: [],
  actions: [],
};

let paused = false;
let seeking = false as false | { target: number; finish: boolean };

timeline.onSeek = (target) => {
  seeking = { target, finish: false };
};
timeline.onFinishSeek = (target) => {
  seeking = { target, finish: true };
};
timeline.onResume = () => {
  paused = false;
};
timeline.onPause = () => {
  paused = true;
};
timeline.onNext = () => {
  seeking = { target: r.index + 1, finish: true };
};
timeline.onPrev = () => {
  seeking = { target: r.index - 1, finish: true };
};

const loop = () => {
  if (!paused && !seeking) {
    if (r.index < r.actions.length) {
      r = replayer(r, { type: "seek", index: r.index + 1 });
    } else {
      r = replayer(r, { type: "tic" });
    }
  }
  if (seeking) {
    r = replayer(r, { type: "seek", index: seeking.target });
    if (seeking.finish) seeking = false;
  }

  // mat4.lookAt(
  //   renderer.viewMatrix,
  //   [Math.sin(Date.now() / 5000) * 14, 8, Math.cos(Date.now() / 5000) * 14],
  //   [0, 0, 0],
  //   [0, 1, 0],
  // );

  timeline.update(
    paused ? "paused" : "running",
    r.index,
    Math.max(2_000, r.actions.length),
    r.actions
      .map((action, index) => ({ action, index }))
      .filter(({ action }) => action.type !== "tic")
      .map(({ index }) => index),
  );

  updateEntities(r.state, renderer.entities, renderer.viewMatrix);
  renderer.updateTime(r.state.date);
  renderer.draw();

  requestAnimationFrame(loop);
};
loop();
