export type Replayer<S, A> = {
  state: S;
  index: number;
  actions: A[];
  snapshots: { state: S; index: number }[];
};

export type ReplayerAction<A> = { type: "seek"; index: number } | A;

export const createReplayer =
  <S, A extends { type: string }>(reduce: (state: S, action: A) => S) =>
  (r: Replayer<S, A>, action: ReplayerAction<A>): Replayer<S, A> => {
    if ((r.snapshots.at(-1)?.index ?? -Infinity) + 200 < r.index) {
      r.snapshots.push({ state: structuredClone(r.state), index: r.index });
    }

    switch (action.type) {
      case "seek": {
        const { index } = action as { type: "seek"; index: number };
        const target = Math.max(0, Math.min(index, r.actions.length));

        let si = 0;
        while (r.snapshots[si + 1] && r.snapshots[si + 1].index <= target) si++;
        const snap = r.snapshots[si];

        if (r.index > target || r.index < snap.index) {
          r.state = structuredClone(snap.state);
          r.index = snap.index;
        }

        while (r.index < target) {
          r.state = reduce(r.state, r.actions[r.index]);
          r.index++;
        }

        return r;
      }

      default: {
        const a = action as A;
        r.actions.length = r.index;
        r.actions.push(a);
        r.state = reduce(r.state, a);
        r.index++;
        return r;
      }
    }
  };
