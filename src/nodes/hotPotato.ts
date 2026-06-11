import type { ReduceNode } from "../engine/systems/reduceNodes";

export const hotPotatoReduce: ReduceNode<"🥔", { created?: true }> = (s) => {
  const pickNext = () => {
    // const candidate = s.peers.filter((id) => id !== s.id);
    const candidate = s.peers;
    return candidate[Math.floor(Math.random() * candidate.length)];
  };

  // init
  if (s.id === 1 && !s.created) {
    s.created = true;

    for (let k = 7; k--; )
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
