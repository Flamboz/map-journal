import type { MapEvent } from "../../map/api";
import type { EventFormState } from "../../map/mapViewTypes";

export function mapEventToFormState(event: MapEvent): EventFormState {
  return {
    name: event.name ?? event.title,
    startDate: event.startDate ?? "",
    endDate: event.endDate ?? "",
    description: event.description ?? "",
    rating: event.rating ?? null,
    labels: event.labels ?? [],
    visitCompany: event.visitCompany ?? "",
    photos: [],
    visibility: event.visibility ?? "private",
    sharedWithEmails: event.sharedWithEmails ?? [],
  };
}
