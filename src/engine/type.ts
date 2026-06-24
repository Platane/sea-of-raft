export type Vec2 = [number, number];
export type Vec3 = [number, number, number];

export type ID = number;

export type World<Message = any, Storage extends Partial<any> = any> = {
  date: number;
  nodes: (Node<Storage> & DisplayableNode)[];
  bottles: Bottle<Message>[];
};

export type Node<Storage extends Partial<any> = any> = {
  storage: Storage;
  dead?: { stepBeforeRecovery: number };
};

export type DisplayableNode = {
  position: Vec2;
  inBoxQueue: {
    position: Vec2;
    direction: Vec2;
  };
};

export type Bottle<Message = any> = {
  message: Message;
  sender: ID;
  receiver: ID;

  position: Vec3;
  velocity: Vec3;
  target: Vec3;

  status:
    | { type: "in-flight" }
    | { type: "inbox-queue"; index: number }
    | { type: "inbox-pop-animation" }
    | { type: "outbox-animation" };
};
