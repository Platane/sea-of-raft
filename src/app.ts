import { mat4 } from "gl-matrix";
import { createState } from "./engine";
import { reduceAnimation } from "./engine/systems/animation";
import { Action as NodeAction, createReducerNodes } from "./engine/systems/reduceNodes";
import { updateEntities } from "./engine/systems/rendererEntities";
import { heartBeatReduce } from "./nodes/heartBeat";
import { createRenderer } from "./renderer";
import { getSpriteSheet } from "./worldRenderer/sprites";
import { hotPotatoReduce } from "./nodes/hotPotato";
import { createTimeline } from "./ui/timeline";
import { createReplayer } from "./replayer";

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

//
// ui
//

const timeline = createTimeline();
document.body.appendChild(timeline.domElement);
timeline.domElement.id = "timeline";

//
// machine
//

const reduceNodes = createReducerNodes(
  hotPotatoReduce,
  // heartBeatReduce,
);

const replayer = createReplayer(
  (state: ReturnType<typeof createState>, action: NodeAction | { type: "tic-animation" }) => {
    if (action.type === "tic-animation") {
      state.date++;
      return reduceAnimation(state);
    }
    return reduceNodes(state as any, action);
  },
);
let r: ReturnType<typeof replayer> = {
  state: createState(5),
  index: 0,
  snapshots: [],
  actions: [],
};

let paused = false;
let seeking = false;

timeline.onSeek = (t) => {
  seeking = true;
  r = replayer(r, { type: "seek", index: t });
};
timeline.onFinishSeek = (t) => {
  seeking = false;
  r = replayer(r, { type: "seek", index: t });
};
timeline.onResume = () => {
  paused = false;
};
timeline.onPause = () => {
  paused = true;
};
timeline.onNext = () => {
  r = replayer(r, { type: "seek", index: r.index + 1 });
};
timeline.onPrev = () => {
  r = replayer(r, { type: "seek", index: Math.max(0, r.index - 1) });
};

const loop = () => {
  if (!paused && !seeking) {
    if (r.index < r.actions.length) {
      r = replayer(r, { type: "seek", index: r.index + 1 });
    } else {
      r = replayer(r, { type: "tic-animation" });
      if (r.state.date % 60 === 0) {
        r = replayer(r, { type: "tic-nodes" });
      }
    }
  }

  domLogs.innerText = JSON.stringify(
    {
      date: r.state.date,
      inFlightMessages: r.state.inFlightMessages.map((x) => x.message),
    },
    null,
    2,
  );

  mat4.lookAt(
    renderer.viewMatrix,
    [Math.sin(Date.now() / 5000) * 10, 5, Math.cos(Date.now() / 5000) * 10],
    [0, 0, 0],
    [0, 1, 0],
  );

  timeline.update(
    paused ? "paused" : "running",
    r.index,
    Math.max(2_000, r.actions.length),
    r.actions.reduce((arr: number[], a, i) => (a.type === "tic-animation" ? arr : [...arr, i]), []),
  );

  updateEntities(r.state, renderer.entities, renderer.viewMatrix);
  renderer.draw();

  requestAnimationFrame(loop);
};
loop();
