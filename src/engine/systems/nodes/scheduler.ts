/**
 * decides which nodes step on a given tic.
 *
 * pure and deterministic in (nodeIds, date) — `date` is the only seed — so the
 * same tic always yields the same schedule, and replay/time-travel stays faithful.
 */
import type { ID } from "../../type";

export type Scheduler<ID = unknown> = (nodeIds: ID[], date: number) => ID[];

export const staggered = <ID = unknown>(nodeIds: ID[], date: number) =>
  nodeIds.filter((_, x) => date % (nodeIds.length * k) === x * k);

const k = 2;
