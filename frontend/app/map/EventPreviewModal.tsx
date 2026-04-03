"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";
import EmptyValue from "../components/EmptyValue";
import StarRating from "../components/StarRating";
import { deleteEvent } from "./api";
import { isApiErrorCode } from "./apiErrors";
import { getSafeRating } from "./eventDisplay";
import { formatEventDateRange } from "./mapViewHelpers";
import type { MapEvent } from "./api";

type EventPreviewModalProps = {
  events: MapEvent[];
  currentIndex: number;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onDelete?: (eventId: string) => void;
};

function getPreviewPhotoUrl(event: MapEvent): string {
  return event.photos?.[0]?.url ?? "";
}

export function EventPreviewModal({
  events,
  currentIndex,
  onClose,
  onPrevious,
  onNext,
  onDelete,
}: EventPreviewModalProps) {
  const router = useRouter();
  const currentEvent = events[currentIndex];
  const { data: session } = useSession();
  const authToken = session?.accessToken ?? "";
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeletingEvent, setIsDeletingEvent] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (!currentEvent) {
    return null;
  }

  const hasMultipleEvents = events.length > 1;
  const previousEvent = hasMultipleEvents ? events[(currentIndex - 1 + events.length) % events.length] : null;
  const nextEvent = hasMultipleEvents ? events[(currentIndex + 1) % events.length] : null;
  const previousPhotoUrl = previousEvent ? getPreviewPhotoUrl(previousEvent) : "";
  const currentPhotoUrl = getPreviewPhotoUrl(currentEvent);
  const nextPhotoUrl = nextEvent ? getPreviewPhotoUrl(nextEvent) : "";
  const safeRating = getSafeRating(currentEvent.rating);
  const hasRating = safeRating > 0;
  const canEdit = currentEvent.accessLevel === "owner";

  async function handleDeleteEvent() {
    setDeleteError(null);
    setIsDeletingEvent(true);

    try {
      await deleteEvent(authToken, currentEvent.id);

      if (typeof onDelete === "function") {
        onDelete(currentEvent.id);
      }

      setIsDeleteModalOpen(false);
      onClose();
      router.refresh();
    } catch (error) {
      if (isApiErrorCode(error, "EVENT_NOT_FOUND")) {
        if (typeof onDelete === "function") {
          onDelete(currentEvent.id);
        }

        setIsDeleteModalOpen(false);
        onClose();
        return;
      }

      setDeleteError("Unable to delete event. Please try again.");
    } finally {
      setIsDeletingEvent(false);
    }
  }

  return (
    <div className="absolute inset-0 z-[1200] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Close event preview"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      <div className="relative z-[1201] w-full max-w-md">
        <button
          type="button"
          aria-label="Close"
          className="absolute right-3 top-3 z-[1202] inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-[color:var(--modal-close-bg)] text-[color:var(--modal-close-text)] shadow-md"
          onClick={onClose}
          title="Close"
        >
          <svg
            aria-hidden="true"
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 6l12 12" />
            <path d="M18 6L6 18" />
          </svg>
        </button>

        <div className="paper-card overflow-hidden rounded-lg bg-white shadow-lg">
          <div className="mb-0 overflow-hidden">
          <div
            className="flex items-start justify-between px-4 py-4"
            style={{ background: "linear-gradient(135deg, var(--modal-hero-1) 0%, var(--modal-hero-2) 100%)" }}
          >
            <div>
              <h3 className="text-2xl font-semibold text-white" style={{ fontFamily: "var(--font-heading)" }}>
                  {currentEvent.name ?? currentEvent.title}
              </h3>

                <div className="mt-2 flex flex-wrap items-center gap-2 gap-y-2">
                  <span
                    className="inline-flex flex-shrink-0 items-center gap-2 rounded-full px-3 py-1 text-xs font-medium"
                    style={{ background: "transparent", border: "1px solid rgba(var(--white-rgb),0.12)" }}
                  >
                    <svg
                      aria-hidden="true"
                      className="h-4 w-4 text-white/90"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="5" width="18" height="16" rx="2" />
                      <path d="M16 3v4M8 3v4" />
                      <path d="M3 11h18" />
                    </svg>
                    <span className="text-xs text-white/90">
                      {formatEventDateRange(currentEvent.startDate, currentEvent.endDate)}
                    </span>
                  </span>

                  {(currentEvent.labels ?? []).slice(0, 5).map((label) => (
                    <span
                      key={label}
                      className="inline-flex flex-shrink-0 items-center rounded-full px-3 py-1 text-xs font-medium text-white"
                      style={{ background: "var(--accent-primary)", border: "1px solid var(--accent-primary-strong)" }}
                    >
                      {label}
                    </span>
                  ))}

                  {currentEvent.visitCompany && (
                    <span
                      className="inline-flex flex-shrink-0 items-center rounded-full px-3 py-1 text-xs font-medium text-white"
                      style={{ background: "var(--badge-visit-bg)", border: "1px solid var(--badge-visit-border)" }}
                    >
                      {currentEvent.visitCompany}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="relative mb-0 h-56 overflow-hidden" style={{ background: "var(--paper-muted)" }}>
            {hasMultipleEvents && (
              <>
                <div className="absolute left-0 top-0 h-full w-[24%] overflow-hidden rounded-r-md opacity-80">
                  {previousPhotoUrl ? (
                    <Image
                      src={previousPhotoUrl}
                      alt="Previous event preview"
                      fill
                      unoptimized
                      loader={({ src }) => src}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-gray-300" />
                  )}
                </div>

                <div className="absolute right-0 top-0 h-full w-[24%] overflow-hidden rounded-l-md opacity-80">
                  {nextPhotoUrl ? (
                    <Image
                      src={nextPhotoUrl}
                      alt="Next event preview"
                      fill
                      unoptimized
                      loader={({ src }) => src}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-gray-300" />
                  )}
                </div>
              </>
            )}

            <div className="absolute left-1/2 top-0 h-full w-[72%] -translate-x-1/2 overflow-hidden">
              {currentPhotoUrl ? (
                <Image
                  src={currentPhotoUrl}
                  alt={`${currentEvent.name ?? currentEvent.title} preview`}
                  fill
                  unoptimized
                  loader={({ src }) => src}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gray-300 text-sm text-gray-600">
                  No photo
                </div>
              )}
            </div>

            <div className="absolute right-3 top-3 z-20 flex flex-col items-end gap-2">
              <div
                className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium text-white"
                style={{ background: "rgba(var(--overlay-rgb),0.85)" }}
              >
                <svg
                  aria-hidden="true"
                  className="h-4 w-4 text-white/90"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21.44 11.05l-8.49 8.49a5 5 0 1 1-7.07-7.07l8.49-8.49a3 3 0 0 1 4.24 4.24L9.12 16.68" />
                </svg>
                <span>
                  {currentEvent.photos && currentEvent.photos.length > 0
                    ? `${currentEvent.photos.length} attachment${currentEvent.photos.length > 1 ? "s" : ""}`
                    : "0 attachments"}
                </span>
              </div>

              {currentEvent.visibility === "share_with" && (
                <div
                  className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium text-white"
                  style={{ background: "rgba(var(--overlay-rgb),0.85)" }}
                >
                  <svg
                    aria-hidden="true"
                    className="h-4 w-4 text-white/90"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  <span>Shared</span>
                </div>
              )}
            </div>

            {hasMultipleEvents && (
              <>
                <button
                  type="button"
                  aria-label="Previous event"
                  className="absolute left-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/80 p-2 text-gray-800"
                  onClick={onPrevious}
                >
                  <svg
                    aria-hidden="true"
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
                <button
                  type="button"
                  aria-label="Next event"
                  className="absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/80 p-2 text-gray-800"
                  onClick={onNext}
                >
                  <svg
                    aria-hidden="true"
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </button>
              </>
            )}
          </div>

          <div className="space-y-3 p-4">
            <div className="flex items-center gap-2">
              {hasRating ? (
                <div className="flex items-center gap-2">
                  <div className="text-sm font-medium text-gray-600">Rating</div>
                  <StarRating rating={safeRating} className="text-sm" />
                  <div className="text-sm font-medium text-gray-800">{safeRating}/10</div>
                </div>
              ) : (
                <EmptyValue value={undefined} placeholder="Not rated" className="text-sm text-gray-600" />
              )}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-b-md border-t border-[color:var(--border-soft)] bg-[color:var(--actionbar-bg)] p-4">
            <div className="flex items-center gap-2">
              {canEdit && (
                <>
                  <button
                    type="button"
                    aria-label="Edit event"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md border bg-white text-gray-700 hover:bg-gray-50"
                    onClick={() => {
                      router.push(`/events/${currentEvent.id}?edit=true`);
                      onClose();
                    }}
                  >
                    <svg
                      aria-hidden="true"
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" />
                      <path d="M20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    aria-label="Delete event"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md border bg-white text-gray-700 hover:bg-gray-50"
                    onClick={() => setIsDeleteModalOpen(true)}
                  >
                    <svg
                      aria-hidden="true"
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 6h18" />
                      <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
                      <path d="M19 6l-1 13a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                  </button>
                </>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Link
                href={`/events/${currentEvent.id}`}
                className="inline-flex rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
              >
                View full →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {isDeleteModalOpen && canEdit && (
        <div
          className="fixed inset-0 z-[1300] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Delete event confirmation"
        >
          <button
            type="button"
            aria-label="Close delete confirmation backdrop"
            onClick={() => {
              if (!isDeletingEvent) {
                setIsDeleteModalOpen(false);
              }
            }}
            className="absolute inset-0 bg-black/70"
          />

          <div className="relative z-[1301] w-full max-w-md rounded-xl bg-white p-5 shadow-lg">
            <h2 className="text-lg font-semibold text-gray-900">Delete event?</h2>
            <p className="mt-2 text-sm text-gray-600">This will permanently delete the event and all associated photos.</p>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  if (!isDeletingEvent) {
                    setIsDeleteModalOpen(false);
                  }
                }}
                disabled={isDeletingEvent}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleDeleteEvent()}
                disabled={isDeletingEvent}
                className="rounded-md border border-red-300 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeletingEvent ? "Deleting..." : "Delete"}
              </button>
            </div>

            {deleteError && <p className="mt-3 text-sm text-red-600">{deleteError}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
