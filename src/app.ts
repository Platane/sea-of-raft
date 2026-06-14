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
import { State } from "./engine/type";

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

type S = {
  currentActionIndex: number;
  state: State;
  actions: (NodeAction | { type: "tic-animation" })[];
  snapshots: { state: State; actionIndex: number }[];
};
const reduce = (
  s: S,
  action: NodeAction | { type: "tic-animation" } | { type: "seek"; actionIndex: number },
): S => {
  if (s.snapshots.length === 0) {
    s.snapshots.push({ state: structuredClone(s.state), actionIndex: s.currentActionIndex });
  }

  if (action.type === "seek") {
    // find closest snapshots
    let i = 0;
    while (s.snapshots[i + 1] && s.snapshots[i + 1].actionIndex <= action.actionIndex) i++;

    if (
      s.currentActionIndex <= action.actionIndex &&
      s.currentActionIndex >= s.snapshots[i].actionIndex
    ) {
    } else {
      s.state = structuredClone(s.snapshots[i].state);
      s.currentActionIndex = s.snapshots[i].actionIndex;
    }

    // re-apply
    while (s.currentActionIndex < action.actionIndex && s.actions[s.currentActionIndex]) {
      const action = s.actions[s.currentActionIndex];
      s.currentActionIndex++;
      if (action.type === "tic-animation") {
        s.state.date++;
        s.state = reduceAnimation(s.state);
      } else {
        s.state = reduceNodes(s.state as any, action);
      }
    }

    return s;
  }

  {
    if (action.type === "tic-animation") {
      s.state.date++;
      s.state = reduceAnimation(s.state);
    } else {
      s.state = reduceNodes(s.state as any, action);
    }

    s.actions.length = s.currentActionIndex;
    s.actions.push(action);
    s.currentActionIndex++;
  }

  // TODO: create new snapshots

  return s;
};

let s: S = {
  currentActionIndex: 0,
  state: createState(3),
  snapshots: [],
  actions: [],
};

let paused = false;
let seeking = false;

timeline.onSeek = (t) => {
  seeking = true;
  reduce(s, { type: "seek", actionIndex: t });
};
timeline.onFinishSeek = (t) => {
  seeking = false;
  reduce(s, { type: "seek", actionIndex: t });
};
timeline.onResume = () => {
  paused = false;
};
timeline.onPause = () => {
  paused = true;
};
timeline.onNext = () => {
  s = reduce(s, { type: "seek", actionIndex: s.currentActionIndex + 1 });
};
timeline.onPrev = () => {
  s = reduce(s, { type: "seek", actionIndex: Math.max(0, s.currentActionIndex - 1) });
};

const loop = () => {
  if (!paused && !seeking) {
    if (s.currentActionIndex < s.actions.length) {
      s = reduce(s, { type: "seek", actionIndex: s.currentActionIndex + 1 });
    } else {
      s = reduce(s, { type: "tic-animation" });
      if (s.state.date % 60 === 0) {
        s = reduce(s, { type: "tic-nodes" });
      }
    }
  }

  domLogs.innerText = JSON.stringify(
    {
      date: s.state.date,
      inFlightMessages: s.state.inFlightMessages.map((x) => x.message),
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
    s.currentActionIndex,
    Math.max(2_000, s.actions.length),
    s.actions.reduce((arr: number[], a, i) => (a.type === "tic-animation" ? arr : [...arr, i]), []),
  );

  updateEntities(s.state, renderer.entities, renderer.viewMatrix);
  renderer.draw();

  requestAnimationFrame(loop);
};
loop();
