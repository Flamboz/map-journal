import type { MapEvent } from "../../map/api";
import StarRating from "../../components/StarRating";

type EventDetailsReadOnlyViewProps = {
  event: MapEvent;
  dateText: string;
  labelsText: string;
  visitCompanyText: string;
  isDeletingEvent: boolean;
  onStartEditing: () => void;
  onOpenDeleteModal: () => void;
};

function buildRatingText(rating?: number | null): string {
  const safeRating = typeof rating === "number" && rating > 0 ? Math.min(10, Math.max(0, rating)) : 0;
  if (safeRating === 0) {
    return "Not rated";
  }

  return `${safeRating}/10`;
}

function getSafeRating(rating?: number | null): number {
  return typeof rating === "number" && rating > 0 ? Math.min(10, Math.max(0, rating)) : 0;
}

export default function EventDetailsReadOnlyView({
  event,
  dateText,
  labelsText,
  visitCompanyText,
  isDeletingEvent,
  onStartEditing,
  onOpenDeleteModal,
}: EventDetailsReadOnlyViewProps) {
  const safeRating = getSafeRating(event.rating);

  return (
    <>
      <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-5">
        <div>
          <p className="text-sm font-medium text-gray-500">Name</p>
          <p className="text-base text-gray-900">{event.name ?? event.title}</p>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-500">Date</p>
          <p className="text-base text-gray-900">{dateText}</p>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-500">Description</p>
          <p className="text-base text-gray-900">{event.description?.trim() ? event.description : "None"}</p>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-500">Rating</p>
          {safeRating === 0 ? (
            <p aria-label="Event rating" className="text-base text-gray-900">
              {buildRatingText(event.rating)}
            </p>
          ) : (
            <StarRating
              rating={safeRating}
              className="flex items-center gap-2 text-base text-gray-900"
              showNumericValue
              numericClassName="text-base text-gray-900"
            />
          )}
        </div>

        <div>
          <p className="text-sm font-medium text-gray-500">Labels</p>
          <p className="text-base text-gray-900">{labelsText}</p>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-500">Visit company</p>
          <p className="text-base text-gray-900">{visitCompanyText}</p>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onStartEditing}
          disabled={isDeletingEvent}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Edit event
        </button>
        <button
          type="button"
          onClick={onOpenDeleteModal}
          disabled={isDeletingEvent}
          className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isDeletingEvent ? "Deleting..." : "Delete event"}
        </button>
      </div>
    </>
  );
}
