import type { State } from "../type";

const QUEUE_SPACING = 0.4;
const ARRIVAL_DIST_SQ = 1.2 * 1.2;
const ARRIVAL_VELOCITY_SQ = 0.04 * 0.04;

const F_center = 0.003;

const F_friction = 0.3;
const F_spring = 0.018;

const F_bottle_repulsion = 0.0008;

const F_raft_repulsion = 0.04;

export const reduceAnimation = (state: State): State => {
  // transfer arrived in-flight bottles to inbox
  for (let i = state.inFlightMessages.length - 1; i >= 0; i--) {
    const bottle = state.inFlightMessages[i];
    const receiver = state.nodes[bottle.receiver];
    if (!receiver) continue;

    const [rx, rz] = receiver.inBoxPosition;
    const [dx, dz] = receiver.inBoxDirection;
    const tx = rx + dx * receiver.inBox.length * QUEUE_SPACING;
    const tz = rz + dz * receiver.inBox.length * QUEUE_SPACING;

    const p = bottle.position as number[];
    const ex = tx - p[0],
      ez = tz - p[1];
    if (ex * ex + ez * ez > ARRIVAL_DIST_SQ) continue;
    const v = bottle.velocity as number[];
    if (v[0] * v[0] + v[1] * v[1] > ARRIVAL_VELOCITY_SQ) continue;
    receiver.inBox.push({
      message: bottle.message,
      sender: bottle.sender,
      position: [p[0], p[1]],
      velocity: [v[0], v[1]],
    });
    state.inFlightMessages.splice(i, 1);
  }

  // collect all bottle entities into a unified physics list
  type Entry = { p: number[]; v: number[]; tx: number; tz: number };
  const all: Entry[] = [];

  for (const bottle of state.inFlightMessages) {
    const receiver = state.nodes[bottle.receiver];
    if (!receiver) continue;
    const [rx, rz] = receiver.inBoxPosition;
    const [dx, dz] = receiver.inBoxDirection;
    const tx = rx + dx * receiver.inBox.length * QUEUE_SPACING;
    const tz = rz + dz * receiver.inBox.length * QUEUE_SPACING;
    all.push({ p: bottle.position as number[], v: bottle.velocity as number[], tx, tz });
  }

  for (let nodeIdx = 0; nodeIdx < state.nodes.length; nodeIdx++) {
    const node = state.nodes[nodeIdx];
    const [rx, rz] = node.inBoxPosition;
    const [dx, dz] = node.inBoxDirection;
    for (let idx = 0; idx < node.inBox.length; idx++) {
      const m = node.inBox[idx];
      if (!m.position || !m.velocity) continue;
      all.push({
        p: m.position as number[],
        v: m.velocity as number[],
        tx: rx + dx * idx * QUEUE_SPACING,
        tz: rz + dz * idx * QUEUE_SPACING,
      });
    }
  }

  if (all.length === 0) return state;

  // physics step
  for (let i = 0; i < all.length; i++) {
    const { p, v, tx, tz } = all[i];
    let ax = 0,
      az = 0;

    // friction
    ax -= v[0] * F_friction;
    az -= v[1] * F_friction;

    // spring attraction toward target, capped
    const ddx = tx - p[0],
      ddz = tz - p[1];
    const fa = Math.min(Math.hypot(ddx, ddz) * F_spring, 0.05);
    const la = Math.hypot(ddx, ddz) + 0.0001;
    ax += (ddx / la) * fa;
    az += (ddz / la) * fa;

    // bottle-bottle repulsion
    for (let j = 0; j < all.length; j++) {
      if (j === i) continue;
      const op = all[j].p;
      const ex = p[0] - op[0],
        ez = p[1] - op[1];
      const lSq = ex * ex + ez * ez;
      // if (lSq > BOTTLE_REPULSION_RADIUS_SQ) continue;
      const ll = Math.sqrt(lSq) + 0.0001;
      const lc = ll + 0.3;
      const f = F_bottle_repulsion / (lc * lc);
      ax += (ex / ll) * f;
      az += (ez / ll) * f;
    }

    // raft repulsion
    for (let nodeIdx = 0; nodeIdx < state.nodes.length; nodeIdx++) {
      const node = state.nodes[nodeIdx];
      const [nx, nz] = node.position;
      const ex = p[0] - nx,
        ez = p[1] - nz;
      const lSq = ex * ex + ez * ez;
      const ll = Math.sqrt(lSq) + 0.0001;
      const lc = ll + 0.5;
      const f = F_raft_repulsion / (lc * lc);
      ax += (ex / ll) * f;
      az += (ez / ll) * f;
    }

    // slight pull toward origin to arc in XZ plane
    ax -= p[0] * F_center;
    az -= p[1] * F_center;

    v[0] += ax;
    v[1] += az;
    p[0] += v[0];
    p[1] += v[1];
  }

  return state;
};
