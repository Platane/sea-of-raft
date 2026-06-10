import type { State } from "./type";

export const createState = (n: number): State => {
  return {
    date: 1,
    nodes: Array.from({ length: n }, (_, k) => {
      const RADIUS = 4;
      const a = (k / n) * Math.PI * 2;
      const x = RADIUS * Math.sin(a);
      const z = RADIUS * Math.cos(a);
      const inward = [-Math.sin(a), -Math.cos(a)];
      return {
        position: [x, z],
        inBoxPosition: [x * 0.7, z * 0.7],
        inBoxDirection: inward,
        outBoxPosition: [x, z],
        diskSpace: {},
        ephemeralSpace: {},
        inBox: [],
      };
    }),
    inFlightMessages: [],
    dropMessages: [],
  };
};
