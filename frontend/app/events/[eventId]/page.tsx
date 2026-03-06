import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "../../../auth.config";
import { fetchEventById } from "../../map/api";
import { formatEventDateRange } from "../../map/mapViewHelpers";
import EventPhotosCarousel from "./EventPhotosCarousel";

type EventDetailsPageProps = {
  params: Promise<{
    eventId: string;
  }>;
};

export default async function EventDetailsPage({ params }: EventDetailsPageProps) {
  const { eventId } = await params;
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ? String(session.user.id) : "";

  if (!userId) {
    redirect("/auth/signin");
  }

  let event;
  try {
    event = await fetchEventById(eventId, userId);
  } catch (error) {
    if (error instanceof Error && error.message === "EVENT_NOT_FOUND") {
      notFound();
    }

    throw error;
  }

  const hasRating = typeof event.rating === "number" && event.rating > 0;
  const dateText = formatEventDateRange(event.startDate, event.endDate);
  const labelsText = event.labels && event.labels.length > 0 ? event.labels.join(", ") : "None";
  const visitCompanyText = event.visitCompany?.trim() ? event.visitCompany : "None";
  const samePinEventIds = event.samePinEventIds ?? [event.id];
  const currentPinEventIndex = samePinEventIds.indexOf(event.id);
  const hasPinNavigation = samePinEventIds.length > 1 && currentPinEventIndex >= 0;
  const previousPinEventId = hasPinNavigation
    ? samePinEventIds[(currentPinEventIndex - 1 + samePinEventIds.length) % samePinEventIds.length]
    : null;
  const nextPinEventId = hasPinNavigation ? samePinEventIds[(currentPinEventIndex + 1) % samePinEventIds.length] : null;

  return (
    <section className="mx-auto w-full max-w-3xl space-y-6 p-6">
      <Link
        href="/"
        className="inline-flex rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        Go back to map
      </Link>

      <h1 className="text-2xl font-semibold text-gray-900">Event details</h1>

      {hasPinNavigation && (
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/events/${previousPinEventId}`}
            className="inline-flex rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Previous event at this pin
          </Link>
          <p className="text-sm text-gray-600">
            Event {currentPinEventIndex + 1} of {samePinEventIds.length} at this pin
          </p>
          <Link
            href={`/events/${nextPinEventId}`}
            className="inline-flex rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Next event at this pin
          </Link>
        </div>
      )}

      <EventPhotosCarousel photos={event.photos ?? []} eventName={event.name ?? event.title} />

      <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-5">
        <div>
          <p className="text-sm font-medium text-gray-500">Name</p>
          <p className="text-base text-gray-900">{event.name ?? event.title}</p>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-500">Date</p>
          <p className="text-base text-gray-900">{dateText || "None"}</p>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-500">Description</p>
          <p className="text-base text-gray-900">{event.description?.trim() ? event.description : "None"}</p>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-500">Rating</p>
          {hasRating ? (
            <p aria-label="Event rating" className="text-base text-gray-900">
              {Array.from({ length: 10 }).map((_, index) => {
                const value = index + 1;
                const isFilled = value <= event.rating!;

                return (
                  <span key={value} className={isFilled ? "text-yellow-400" : "text-slate-300"}>
                    ★
                  </span>
                );
              })}{" "}
              ({event.rating}/10)
            </p>
          ) : (
            <p className="text-base text-gray-900">Not rated</p>
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
          disabled
          className="cursor-not-allowed rounded-md bg-gray-300 px-4 py-2 text-sm font-medium text-gray-600"
        >
          Edit event
        </button>
        <button
          type="button"
          disabled
          className="cursor-not-allowed rounded-md bg-gray-300 px-4 py-2 text-sm font-medium text-gray-600"
        >
          Delete event
        </button>
      </div>
    </section>
  );
}
