import type { ReduceNode } from "../engine/systems/reduceNodes";

export const heartBeatReduce: ReduceNode<
  "ping" | "pong",
  { date: number; lastSeen: number[]; sent: number[] }
> = (s) => {
  // init
  s.date = s.date || 0;
  s.lastSeen = s.lastSeen || {};
  s.sent = s.sent || {};

  // step internal clock
  s.date++;

  // answer to messages

  while (s.inBox.length) {
    const { sender, message } = s.inBox.shift()!;
    s.lastSeen[sender] = s.date;

    if (message === "ping") s.outBox.push({ receiver: sender, message: "pong" });
  }

  // trigger ping messages
  const jitter = s.id ** 7 % 3;
  const longTimeNoSee = 10 + jitter;
  const retryDelay = 6 + jitter;

  for (const id of s.peers) {
    if (id === s.id) continue;

    const shouldPing = s.lastSeen[id] ? s.lastSeen[id] + longTimeNoSee < s.date : jitter < s.date;

    if (shouldPing && (s.sent[id] ?? 0) + retryDelay < s.date) {
      s.sent[id] = s.date;
      s.outBox.push({ receiver: id, message: "ping" });
    }
  }

  return s;
};
