import type { State } from "../type";

export type Action =
  | { type: "tic-nodes" }
  | { type: "crash"; duration: number; node: ID }
  | { type: "isolate"; duration: number; node: ID }
  | { type: "dropMessage"; index: number };

export const createReducerNodes =
  <Message, EphemeralSpace extends Partial<any>, DiskSpace extends Partial<any>>(
    reduceNode: ReduceNode<Message, EphemeralSpace, DiskSpace>,
  ) =>
  <A extends Action>(
    state: State<Message, EphemeralSpace, DiskSpace>,
    action: A,
  ): State<Message, EphemeralSpace, DiskSpace> => {
    switch (action.type) {
      case "tic-nodes": {
        const peers = state.nodes.map((_, i) => i + 1);

        for (let i = 0; i < state.nodes.length; i++) {
          const node = state.nodes[i];

          if (node.dead) {
            if (node.dead.recoverDate < state.date) {
              node.dead = undefined;
              node.ephemeralSpace = {} as unknown as EphemeralSpace;
              node.inBox = [];
            }

            // TODO: drop every message in inbox

            continue;
          }

          const {
            outBox,
            inBox,
            flushToDisk,
            diskSpace: _diskSpace,
            peers: _peers,
            id: _id,
            ...rest
          } = reduceNode({
            peers: peers,
            id: i,
            ...node.ephemeralSpace,
            inBox: node.inBox,
            diskSpace: node.diskSpace,
            flushToDisk: {} as unknown as DiskSpace,
            outBox: [],
          });

          node.inBox = inBox;
          Object.assign(node.ephemeralSpace, rest);
          Object.assign(node.diskSpace, flushToDisk);

          for (const m of outBox) {
            state.inFlightMessages.push({
              ...m,
              position: node.outBoxPosition,
              sender: i,
              sendDate: state.date,
            });
          }
        }
        break;
      }

      case "crash":
      case "isolate": {
        const node = state.nodes[action.node];
        if (node) node.dead = { recoverDate: state.date + action.duration };
        break;
      }

      case "dropMessage": {
        const msg = state.inFlightMessages[action.index];
        if (!msg) break;
        state.inFlightMessages.splice(action.index, 1);
        state.dropMessages.push({ ...msg, dropDate: state.date });
        break;
      }
    }
    return state;
  };

export type NodeState<
  Message = unknown,
  EphemeralSpace extends Partial<any> = never,
  DiskSpace extends Partial<any> = never,
> = {
  id: ID;
  inBox: { message: Message; sender: ID }[];
  outBox: { message: Message; receiver: ID }[];
  readonly diskSpace: DiskSpace;
  readonly peers: ID[];

  flushToDisk: Partial<DiskSpace>;
  hasHat?: boolean;
} & EphemeralSpace;

type ID = number;

export type ReduceNode<
  Message = unknown,
  EphemeralSpace extends Partial<any> = never,
  DiskSpace extends Partial<any> = never,
> = (
  state: NodeState<Message, EphemeralSpace, DiskSpace>,
) => NodeState<Message, EphemeralSpace, DiskSpace>;
