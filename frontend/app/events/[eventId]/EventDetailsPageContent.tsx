import Link from "next/link";
import { redirect } from "next/navigation";
import { fetchEventById } from "../../map/api";
import { isApiErrorCode } from "../../map/apiErrors";
import { formatEventDateRange } from "../../map/mapViewHelpers";
import EventDetailsClient from "./EventDetailsClient";
import EventDetailsMediaFallback from "./EventDetailsMediaFallback";
import EventDetailsReadOnlyView from "./EventDetailsReadOnlyView";

type EventDetailsPageContentProps = {
  eventId: string;
  authToken: string;
  currentUserEmail: string | null;
};

function buildSamePinNavigation(eventId: string, samePinEventIds: string[]) {
  const currentPinEventIndex = samePinEventIds.indexOf(eventId);
  const hasPinNavigation = samePinEventIds.length > 1 && currentPinEventIndex >= 0;

  if (!hasPinNavigation) {
    return null;
  }

  return {
    currentPinEventIndex,
    previousPinEventId: samePinEventIds[(currentPinEventIndex - 1 + samePinEventIds.length) % samePinEventIds.length],
    nextPinEventId: samePinEventIds[(currentPinEventIndex + 1) % samePinEventIds.length],
    totalEvents: samePinEventIds.length,
  };
}

export default async function EventDetailsPageContent({
  eventId,
  authToken,
  currentUserEmail,
}: EventDetailsPageContentProps) {
  let event;
  try {
    event = await fetchEventById(eventId, authToken);
  } catch (error) {
    if (isApiErrorCode(error, "EVENT_NOT_FOUND")) {
      redirect("/?error=event-not-found");
    }

    throw error;
  }

  const readOnlyContentId = `event-read-only-${event.id}`;
  const mediaContentId = `event-media-${event.id}`;
  const canEdit = event.accessLevel === "owner";
  const samePinEventIds = event.samePinEventIds ?? [event.id];
  const samePinNavigation = buildSamePinNavigation(event.id, samePinEventIds);

  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 p-6">
      <div id={readOnlyContentId} className="space-y-6">
        {samePinNavigation && (
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/events/${samePinNavigation.previousPinEventId}`}
              className="inline-flex rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Previous event at this pin
            </Link>
            <p className="text-sm text-gray-600">
              Event {samePinNavigation.currentPinEventIndex + 1} of {samePinNavigation.totalEvents} at this pin
            </p>
            <Link
              href={`/events/${samePinNavigation.nextPinEventId}`}
              className="inline-flex rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Next event at this pin
            </Link>
          </div>
        )}

        <EventDetailsReadOnlyView
          event={event}
          dateText={formatEventDateRange(event.startDate, event.endDate)}
          visitCompany={event.visitCompany}
        />

        {!canEdit && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            This event is shared with you. You can view it here, but edits, deletes, and attachment changes are disabled.
          </div>
        )}
      </div>

      <div id={mediaContentId}>
        <EventDetailsMediaFallback photos={event.photos ?? []} />
      </div>

      <EventDetailsClient
        initialEvent={event}
        authToken={authToken}
        currentUserEmail={currentUserEmail}
        readOnlyContentId={readOnlyContentId}
        mediaContentId={mediaContentId}
      />
    </main>
  );
}
