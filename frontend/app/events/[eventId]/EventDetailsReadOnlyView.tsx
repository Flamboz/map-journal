import type { MapEvent } from "../../map/api";
import StarRating from "../../components/StarRating";
import EmptyValue from "../../components/EmptyValue";
import { getSafeRating } from "../../map/eventDisplay";

type EventDetailsReadOnlyViewProps = {
  event: MapEvent;
  dateText: string;
  visitCompany?: string | null;
  isDeletingEvent: boolean;
  onStartEditing: () => void;
  onOpenDeleteModal: () => void;
};

export default function EventDetailsReadOnlyView({
  event,
  dateText,
  visitCompany,
  isDeletingEvent,
  onStartEditing,
  onOpenDeleteModal,
}: EventDetailsReadOnlyViewProps) {
  const safeRating = getSafeRating(event.rating);

  return (
    <div className="mt-6 space-y-6">
      <div className="mx-auto w-full max-w-3xl">
        <div className="relative rounded-2xl bg-gradient-to-r from-slate-900/95 to-slate-800/95 p-6 text-white shadow-md">
          <h1 className="text-3xl font-semibold">{event.name ?? event.title}</h1>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-3xl grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-gray-500">DATE</p>
          <p className="mt-2 text-lg text-gray-900">
            <EmptyValue
              value={dateText}
              placeholder="None"
              className="text-lg text-gray-900"
              placeholderClassName="text-lg italic text-gray-500"
            />
          </p>
        </div>

        <div className="rounded-lg bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-gray-500">VISIT COMPANY</p>
          <p className="mt-2 text-lg text-gray-900">
            <EmptyValue
              value={visitCompany}
              placeholder="None"
              className="text-lg text-gray-900"
              placeholderClassName="text-lg italic text-gray-500"
            />
          </p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-3xl space-y-4">
        <div className="rounded-lg bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-gray-500">DESCRIPTION</p>
          <p className="mt-2 text-base text-gray-700">
            <EmptyValue
              value={event.description}
              placeholder="None"
              className="text-base text-gray-700"
              placeholderClassName="text-base italic text-gray-500"
            />
          </p>
        </div>

        <div className="rounded-lg bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-gray-500">RATING</p>
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {safeRating === 0 ? (
                <EmptyValue
                  value={undefined}
                  placeholder="Not rated"
                  className="text-base text-gray-900"
                  placeholderClassName="text-base italic text-gray-500"
                />
              ) : (
                <StarRating rating={safeRating} numericClassName="text-base text-gray-900" />
              )}
            </div>
            <div className="text-sm text-gray-700">
              <EmptyValue
                value={safeRating > 0 ? `${safeRating}/10` : undefined}
                placeholder="Not rated"
                className="text-sm text-gray-700"
                placeholderClassName="text-sm italic text-gray-500"
              />
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-gray-500">LABELS</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {(event.labels ?? []).length ? (
              (event.labels ?? []).map((label) => (
                <span key={label} className="rounded-full border border-gray-200 bg-[#f6efe8] px-3 py-1 text-sm text-gray-800">{label}</span>
              ))
            ) : (
              <EmptyValue placeholder="None" className="text-sm text-gray-700" placeholderClassName="text-sm italic text-gray-500" />
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-3xl items-center justify-between">
        <button
          type="button"
          onClick={onOpenDeleteModal}
          disabled={isDeletingEvent}
          className="rounded-lg border border-red-200 bg-white px-4 py-3 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isDeletingEvent ? (
            "Deleting..."
          ) : (
            <span className="inline-flex items-center gap-2">
              <svg aria-hidden="true" className="h-5 w-5 text-red-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18" />
                <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
                <path d="M19 6l-1 13a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
              <span>Delete event</span>
            </span>
          )}
        </button>

        <div>
          <button
            type="button"
            onClick={onStartEditing}
            disabled={isDeletingEvent}
            className="rounded-full bg-slate-900 px-6 py-3 text-sm font-medium text-white hover:bg-slate-800"
          >
            <span className="inline-flex items-center gap-2">
              <svg aria-hidden="true" className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" />
                <path d="M20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
              </svg>
              <span>Edit event</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
