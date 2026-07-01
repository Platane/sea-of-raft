import { mat4 } from "gl-matrix";
import { step as step_bottleLifeCycle } from "./systems/bottleLifeCycle/step";
import { createStepper as createStepper_node } from "./systems/nodes/stepNode";
import type { Scheduler } from "./systems/nodes/scheduler";
import { UpdateNode } from "./systems/nodes/type";
import { step as step_physics } from "./systems/physics/step";
import { ID, World } from "./type";

export const createWorld = (n: number): World => {
  return {
    date: 1,
    bottles: [],
    nodes: Array.from({ length: n }, (_, k) => {
      const RADIUS = 4;
      const a = (k / n) * Math.PI * 2;
      const x = RADIUS * Math.sin(a);
      const z = RADIUS * Math.cos(a);
      const outward: [number, number] = [Math.sin(a), Math.cos(a)];
      const tangent: [number, number] = [Math.cos(a), -Math.sin(a)];
      const QUEUE_ANGLE = Math.PI / 6;
      const c = Math.cos(QUEUE_ANGLE),
        s = Math.sin(QUEUE_ANGLE);
      const queueDir: [number, number] = [
        c * tangent[0] + s * outward[0],
        c * tangent[1] + s * outward[1],
      ];
      // the queue anchor must sit outside the node's repulsion well, otherwise
      // a bottle aimed at it can never settle there.
      const INBOX_OFFSET = 1.35;
      return {
        position: [x, z],
        storage: {},
        inBoxQueue: {
          position: [x + outward[0] * INBOX_OFFSET, z + outward[1] * INBOX_OFFSET],
          direction: queueDir,
        },
      };
    }),
  };
};

export const createStepper = (
  updateNode: UpdateNode,
  scheduler: Scheduler<ID>,
  getHeight: (time: number, x: number, y: number) => number,
  viewMatrix: mat4,
) => {
  const step_node = createStepper_node(updateNode, scheduler);

  return (world: World) => {
    world.date++;
    step_node(world);
    step_bottleLifeCycle(world, viewMatrix);
    step_physics(world, getHeight);
  };
};
