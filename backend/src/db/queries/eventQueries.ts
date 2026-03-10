import { get } from "../sqlite";

export type EventOwnershipRow = {
  id: string;
  user_id: number;
};

export async function getEventOwnership(eventId: string): Promise<EventOwnershipRow | null> {
  const row = (await get("SELECT id, user_id FROM events WHERE id = ?", [eventId])) as EventOwnershipRow | null;
  return row;
}

export function isOwnedByUser(ownerUserId: number, requestUserId: number): boolean {
  return Number(ownerUserId) === requestUserId;
}
