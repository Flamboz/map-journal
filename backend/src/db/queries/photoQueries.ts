import { all, run } from "../sqlite";

export type OrderedPhotoId = {
  id: string;
};

export async function getOrderedPhotoIds(eventId: string): Promise<OrderedPhotoId[]> {
  return (await all(
    `SELECT id
     FROM event_photos
     WHERE event_id = ?
     ORDER BY sort_order ASC, created_at ASC, id ASC`,
    [eventId],
  )) as OrderedPhotoId[];
}

export async function resequencePhotoSortOrder(photoIds: string[]): Promise<void> {
  let sortOrder = 1;
  for (const photoId of photoIds) {
    await run("UPDATE event_photos SET sort_order = ? WHERE id = ?", [sortOrder, photoId]);
    sortOrder += 1;
  }
}
