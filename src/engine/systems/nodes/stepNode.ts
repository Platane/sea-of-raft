import type { Bottle, ID, World } from "../../type";
import type { Scheduler } from "./scheduler";
import { UpdateNode } from "./type";

/**
 * one logical tic: asks the scheduler which nodes act this tic (given the current
 * date), and steps each. Pure-ish — mutates world; deterministic if updateNode
 * and scheduler are. The caller owns advancing `world.date` between tics.
 */
export const createStepper =
  (updateNode: UpdateNode, scheduler: Scheduler<ID>) =>
  (world: World): void => {
    const nodeIds = world.nodes.map((_, i) => i as ID);
    for (const id of scheduler(nodeIds, world.date)) stepNode(world, updateNode, id);
  };

/**
 * runs a single node's program for one logical tic.
 *
 * builds the Context and calls updateNode, turning reads into inbox consumption
 * and sends into freshly spawned in-flight carriers. The caller owns the loop
 * (on `tic-nodes`, step every node).
 */
export const stepNode = (world: World, updateNode: UpdateNode, nodeId: ID): void => {
  const node = world.nodes[nodeId];

  if (node.dead) {
    node.dead.stepBeforeRecovery--;
    if (node.dead.stepBeforeRecovery <= 0) {
      node.dead = undefined;
      node.storage = {};
    }
    return; // a dead node does not run its program
  }

  // entities keep their insertion order, so this is a stable,
  // replay-deterministic peer list
  const peers = world.nodes.map((_, i) => i as ID);
  const inBox = world.bottles
    .filter((b) => b.status.type === "inbox-queue" && b.receiver === nodeId)
    .sort(
      (a, b) =>
        (a.status as Extract<Bottle["status"], { type: "inbox-queue" }>).index -
        (b.status as Extract<Bottle["status"], { type: "inbox-queue" }>).index,
    );

  updateNode({
    peers,
    id: nodeId,
    storage: node.storage,

    readNextMessage: () => {
      const bottle = inBox.shift();
      if (!bottle) return null;

      bottle.status = { type: "inbox-pop-animation" };

      return { message: bottle.message, sender: bottle.sender };
    },

    sendMessage: (receiver, message) => {
      world.bottles.push({
        sender: nodeId,
        receiver,
        message,
        status: { type: "outbox-animation" },
        position: [0, 0, 0],
        velocity: [0, 0, 0],
        target: [0, 0, 0],
      });
    },
  });

  inBox.forEach(
    (b, i) => ((b.status as Extract<Bottle["status"], { type: "inbox-queue" }>).index = i),
  );
};
