import type { ID } from "../../type";

export type Context<Message = any, Storage extends Partial<any> = Partial<any>> = {
  readonly peers: ID[];
  readonly id: ID;
  storage: Storage;

  readNextMessage: () => { message: Message; sender: ID } | null;
  sendMessage: (receiver: ID, message: Message) => void;
};

export type UpdateNode<Message = any, Storage extends Partial<any> = Partial<any>> = (
  context: Context<Message, Storage>,
) => void;
