import type { ReduceNode } from "../engine/systems/reduceNodes";

export const hotPotatoReduce: ReduceNode<"🥔", { created?: true }> = (s) => {
  const pickNext = () => {
    const i = s.peers.indexOf(s.id) + 1;
    return s.peers[i % s.peers.length];
  };

  // init
  if (s.id === 1 && !s.created) {
    s.created = true;

    for (let k = 1; k--; )
      s.outBox.push({
        receiver: pickNext(),
        message: "🥔",
      });
  }

  // answer to messages
  if (s.inBox.length) {
    const { message } = s.inBox.shift()!;

    s.outBox.push({
      receiver: pickNext(),
      message,
    });
  }

  return s;
};
