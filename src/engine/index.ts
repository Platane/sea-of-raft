import type { State } from "./type";

export const createState = (n: number): State => {
  return {
    date: 1,
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
      return {
        position: [x, z],
        inBoxPosition: [x + tangent[0] * 0.7, z + tangent[1] * 0.7],
        inBoxDirection: queueDir,
        outBoxPosition: [x + outward[0] * 0.8, z + outward[1] * 0.8],
        outBoxDirection: outward,
        diskSpace: {},
        ephemeralSpace: {},
        inBox: [],
      };
    }),
    inFlightMessages: [],
    dropMessages: [],
  };
};
