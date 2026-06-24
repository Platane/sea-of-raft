import { mat4, vec3 } from "gl-matrix";
import type { Vec2, Vec3, World } from "../../type";

export const step = (world: World, viewMatrix: mat4): void => {
  // for all bottles
  for (let i = world.bottles.length - 1; i >= 0; i--) {
    const bottle = world.bottles[i];

    // when a bottle is in "outbox-animation" it need to transition to
    // "in-flight" and we need to set it's default position, which should be
    // based on the pirate sprite position at that moment, that we can kind of
    // guess from the viewWorld matrix.
    // considering the sprite orientation ( from the viewmatrix) it should
    // appear on its "hand" = a anchor (x,y) that i will tweak visually — the
    // hand is always the side pointing to 0,0.
    // the bottle can have a y position at this stage.
    if (bottle.status.type === "outbox-animation") {
      const sender = world.nodes[bottle.sender];
      if (!sender) continue;
      bottle.position = handPosition(viewMatrix, sender.position);
      bottle.status = { type: "in-flight" };
    }

    // when a bottle is in flight, it's target should be the next available
    // slot in the receiver queue.
    // next available slot is computed from
    //   max( (bottle with receiver R and status = inbox-queue).index ) + 1
    // there should be no race condition then (maybe weird bottle path but
    // whatever).
    //
    // when a bottle is in flight and close enough from the target (next
    // available slot in the queue) it should transition to inbox-queue.
    else if (bottle.status.type === "in-flight") {
      const receiver = world.nodes[bottle.receiver];
      if (!receiver) continue;

      const nextIndex =
        world.bottles.reduce(
          (max, b) =>
            b.receiver === bottle.receiver &&
            b.status.type === "inbox-queue" &&
            b.status.index > max
              ? b.status.index
              : max,
          -1,
        ) + 1;

      bottle.target = slotPosition(receiver, nextIndex);

      if (vec3.sqrDist(bottle.position, bottle.target) <= 0.3 * 0.3)
        bottle.status = { type: "inbox-queue", index: nextIndex };
    }

    // a parked bottle just tracks its slot.
    else if (bottle.status.type === "inbox-queue") {
      const receiver = world.nodes[bottle.receiver];
      if (!receiver) continue;
      bottle.target = slotPosition(receiver, bottle.status.index);
    }

    // when a bottle is in the state inbox-pop-animation, its target should be
    // the hand of the pirate (with the same anchor / viewMatrix logic).
    // when it reaches the target it should be removed.
    else if (bottle.status.type === "inbox-pop-animation") {
      const receiver = world.nodes[bottle.receiver];
      if (!receiver) continue;
      bottle.target = handPosition(viewMatrix, receiver.position);

      if (vec3.sqrDist(bottle.position, bottle.target) <= 0.5 * 0.5) world.bottles.splice(i, 1);
    }
  }
};

const QUEUE_SPACING = 0.4;

const HAND_OFFSET: Vec3 = [0.5, 0.5, -0.01];

/**
 * world-space position of a node's "hand", guessed from the sprite billboard.
 *
 * the sprite is a Y-billboard: its right/forward axes in world space come from
 * the camera (same atan2(viewMatrix[2], [10]) the renderer uses), projected on
 * the XZ plane. the hand should always be on the side pointing to 0,0, so we
 * pick the sign of the across-offset that brings it closer to the origin.
 */
const right = new Float32Array(3) as vec3;
const fwd = new Float32Array(3) as vec3;

const handPosition = (viewMatrix: mat4, [nx, nz]: Vec2): Vec3 => {
  // billboard right + forward (toward camera) axes, on the XZ plane
  vec3.normalize(right, vec3.set(right, viewMatrix[10], 0, -viewMatrix[2]));
  vec3.normalize(fwd, vec3.set(fwd, viewMatrix[2], 0, viewMatrix[10]));

  // side pointing to 0,0: sign so that +right*sign points toward the origin
  const sign = right[0] * nx + right[2] * nz <= 0 ? 1 : -1;

  const [ox, oy, oz] = HAND_OFFSET;
  const out: Vec3 = [nx, oy, nz];
  vec3.scaleAndAdd(out, out, right, ox * sign);
  vec3.scaleAndAdd(out, out, fwd, oz);
  return out;
};

/** world-space position of slot `index` in a receiver's inbox queue */
const slotPosition = (receiver: World["nodes"][number], index: number): Vec3 => {
  const [px, pz] = receiver.inBoxQueue.position;
  const [dx, dz] = receiver.inBoxQueue.direction;
  return [px + dx * index * QUEUE_SPACING, HAND_OFFSET[1], pz + dz * index * QUEUE_SPACING];
};
