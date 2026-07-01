export type Replayer<S, A> = {
  state: S;
  index: number;
  actions: A[];
  snapshots: { state: S; index: number; tmp: boolean }[];
};

export type SeekAction = {
  type: "seek";
  index: number;
  mightSeekMore?: boolean;
};

const SNAPSHOT_INTERVAL = 200;
const SNAPSHOT_INTERVAL_WHILE_SEEKING = 20;

export const createReplayer =
  <S, A extends { type: string }>(reduce: (state: S, action: A) => S) =>
  (r: Replayer<S, A>, action: A | SeekAction): Replayer<S, A> => {
    const lastSnapshotIndex = r.snapshots.at(-1)?.index ?? -Infinity;
    if (lastSnapshotIndex + SNAPSHOT_INTERVAL < r.index) {
      r.snapshots.push({
        state: structuredClone(r.state),
        index: r.index,
        tmp: false,
      });
    }

    switch (action.type) {
      case "seek": {
        const { index, mightSeekMore } = action as SeekAction;
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

          if (mightSeekMore && r.snapshots[si].index + SNAPSHOT_INTERVAL_WHILE_SEEKING < r.index) {
            si++;
            r.snapshots.splice(si, 0, {
              state: structuredClone(r.state),
              index: r.index,
              tmp: true,
            });
          }
        }

        if (!mightSeekMore) {
          r.snapshots = r.snapshots.filter((s) => !s.tmp);
        }

        return r;
      }

      default: {
        const a = action as A;

        // fork the history
        r.actions.length = r.index;
        r.actions.push(a);
        r.state = reduce(r.state, a);
        r.index++;
        return r;
      }
    }
  };
