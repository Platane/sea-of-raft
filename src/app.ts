import { mat4 } from "gl-matrix";
import { createState } from "./engine";
import { reduceAnimation } from "./engine/systems/animation";
import { createReducerNodes } from "./engine/systems/reduceNodes";
import { updateEntities } from "./engine/systems/rendererEntities";
import { heartBeatReduce } from "./nodes/heartBeat";
import { createRenderer } from "./renderer";
import { getSpriteSheet } from "./worldRenderer/sprites";

// import "./scripts/generateTileSet";

const canvas = document.getElementById("main-canvas") as HTMLCanvasElement;
const domLogs = document.getElementById("logs") as HTMLElement;

const renderer = createRenderer(canvas, {
  spriteSheet: await getSpriteSheet(),
});

mat4.lookAt(renderer.viewMatrix, [1, 5, 10], [0, 0, 0], [0, 1, 0]);

window.onresize = () =>
  renderer.resize(window.innerWidth, window.innerHeight, Math.min(window.devicePixelRatio ?? 1, 2));
(window as any).onresize();

let state = createState(3);
const reduceNodes = createReducerNodes(heartBeatReduce);

(window as any).__state = state;

const loop = () => {
  state.date++;
  state = reduceAnimation(state);

  if (state.date % 60 === 0) state = reduceNodes(state as any, { type: "tic-nodes" });

  domLogs.innerText = JSON.stringify(
    {
      date: state.date,
      inFlightMessages: state.inFlightMessages.map((x) => x.message),
    },
    null,
    2,
  );

  updateEntities(state, renderer.entities);
  renderer.draw();

  requestAnimationFrame(loop);
};
loop();
