export type Vec2 = [number, number];

export type ID = number;

export type State<
  Message = any,
  EphemeralSpace extends Partial<any> = any,
  DiskSpace extends Partial<any> = any,
> = {
  date: number;
  nodes: {
    position: Vec2;
    inBoxPosition: Vec2;
    inBoxDirection: Vec2;
    outBoxPosition: Vec2;
    outBoxDirection: Vec2;
    diskSpace: DiskSpace;
    ephemeralSpace: EphemeralSpace;
    inBox: { message: Message; sender: ID; position?: Vec2; velocity?: Vec2 }[];
    hasHat?: boolean;
    dead?: { recoverDate: number };
    isolated?: { recoverDate: number };
  }[];
  inFlightMessages: {
    message: Message;
    sender: ID;
    receiver: ID;
    sendDate: number;
    position: Vec2;
    velocity: Vec2;
  }[];
  dropMessages: {
    message: Message;
    sender: ID;
    receiver: ID;
    sendDate: number;
    dropDate: number;
    position: Vec2;
  }[];
};
