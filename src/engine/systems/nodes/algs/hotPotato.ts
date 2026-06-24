import { hashInt } from "../../../../utils/hash";
import { Context } from "../type";

export const updateNode_hotPotato = (context: Context<"🥔", { clock: number }>) => {
  //
  // init
  if (!context.storage.clock && context.peers.indexOf(context.id) === 0) {
    context.sendMessage(context.peers.at(-1)!, "🥔");
    for (let k = 100; k--; ) {
      const rand = hashInt(k);
      const next = context.peers[rand % context.peers.length];
      context.sendMessage(next, "🥔");
    }
  }

  context.storage.clock = 1 + (context.storage.clock ?? 0);

  //
  // answer to message

  const message = context.readNextMessage()?.message;
  if (message) {
    const rand = hashInt(context.peers.indexOf(context.id) ** 2 + context.storage.clock);
    const next = context.peers[rand % context.peers.length];
    context.sendMessage(next, message);
  }
};
