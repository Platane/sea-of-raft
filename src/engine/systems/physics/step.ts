import { World } from "../../type";

// ported from the previous engine (see engine/systems/animation.ts).
// collisions / spring / repulsion all live in the XZ plane. y is handled
// separately by a buoyancy phase: a damped spring toward the water surface
// (y = 0) so a bottle born at hand height falls down and settles, no rebound.
const F_friction = 0.3;
const F_spring = 0.006;
const SPRING_CAP = 0.03;

// y axis "water": F_buoyancy pulls toward the surface (gravity when above,
// Archimedes push when submerged), F_water_drag damps it. Overdamped so the
// bottle eases down to y = 0 without bouncing.
const F_buoyancy = 0.01;
const F_water_drag = 0.2;

const F_bottle_repulsion = 0.0005;
const BOTTLE_SOFTENING = 0.2;

const F_raft_repulsion = 0.01;
const RAFT_SOFTENING = 0.5;

const EPS = 1e-4;

/**
 * one physics tic, in the XZ plane. For every bottle it accumulates a force —
 * friction, a capped elastic spring toward its target, pairwise repulsion from
 * every other bottle, repulsion from every raft (node), and a gentle pull
 * toward origin — then integrates. Deterministic: depends only on world state.
 *
 * index conventions: bottle position/velocity/target are Vec3 [x, y, z]
 * (plane = 0, 2; y untouched), while node.position is Vec2 [x, z] (plane = 0, 1).
 */
export const step = (world: World): void => {
  for (const bottle of world.bottles) {
    const p = bottle.position;
    const v = bottle.velocity;
    let ax = 0;
    let az = 0;

    // friction
    ax -= v[0] * F_friction;
    az -= v[2] * F_friction;

    // spring attraction toward target, capped
    const ddx = bottle.target[0] - p[0];
    const ddz = bottle.target[2] - p[2];
    const la = Math.hypot(ddx, ddz) + EPS;
    const fa = Math.min(la * F_spring, SPRING_CAP);
    ax += (ddx / la) * fa;
    az += (ddz / la) * fa;

    // bottle-bottle repulsion
    for (const otherBottle of world.bottles) {
      if (bottle === otherBottle) continue;

      const ex = p[0] - otherBottle.position[0];
      const ez = p[2] - otherBottle.position[2];
      const ll = Math.hypot(ex, ez) + EPS;
      const lc = ll + BOTTLE_SOFTENING;
      const f =
        (F_bottle_repulsion / (lc * lc)) * (bottle.status.type == "inbox-pop-animation" ? 0.2 : 1);
      ax += (ex / ll) * f;
      az += (ez / ll) * f;
    }

    // bottle-raft repulsion (node.position is Vec2 [x, z])
    if (bottle.status.type !== "inbox-pop-animation")
      for (const raft of world.nodes) {
        const ex = p[0] - raft.position[0];
        const ez = p[2] - raft.position[1];
        const ey = p[1];
        const ll = Math.hypot(ex, ez) + EPS;
        const lc = ll + RAFT_SOFTENING;
        const f = F_raft_repulsion / (lc * lc);
        ax += (ex / ll) * f;
        az += (ez / ll) * f;
      }

    // slight pull toward origin to arc in XZ plane
    // ax -= p[0] * F_center;
    // az -= p[2] * F_center;

    // y axis. while popping out of the inbox the bottle is being grabbed by a
    // hand, so it leaves the water: no buoyancy, just the same friction + capped
    // spring as the XZ plane, pulling it up toward the target (hand) height.
    // otherwise it floats: a damped spring toward the water surface (y = 0).
    let ay = 0;
    if (bottle.status.type === "inbox-pop-animation") {
      ay -= v[1] * F_friction;
      const ddy = bottle.target[1] - p[1];
      const lay = Math.abs(ddy) + EPS;
      const fay = Math.min(lay * F_spring, SPRING_CAP);
      ay += (ddy / lay) * fay;
    } else {
      ay -= p[1] * F_buoyancy;
      ay -= v[1] * F_water_drag;
    }

    v[0] += ax;
    v[1] += ay;
    v[2] += az;
    p[0] += v[0];
    p[1] += v[1];
    p[2] += v[2];
  }
};
