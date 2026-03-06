"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  deleteEventPhoto,
  fetchAllowedLabels,
  fetchAllowedVisitCompanies,
  fetchEventById,
  setEventPreviewPhoto,
  type MapEvent,
  updateEvent,
  uploadEventPhotos,
} from "../../map/api";
import { eventDraftValidationSchema, formatEventDateRange } from "../../map/mapViewHelpers";
import type { EventFormState } from "../../map/mapViewTypes";
import EventPhotosCarousel from "./EventPhotosCarousel";

type EventDetailsClientProps = {
  initialEvent: MapEvent;
  userId: string;
};

function mapEventToFormState(event: MapEvent): EventFormState {
  return {
    name: event.name ?? event.title,
    startDate: event.startDate ?? "",
    endDate: event.endDate ?? "",
    description: event.description ?? "",
    rating: event.rating ?? null,
    labels: event.labels ?? [],
    visitCompany: event.visitCompany ?? "",
    photos: [],
  };
}

function buildRatingText(rating?: number | null): string {
  const safeRating = typeof rating === "number" && rating > 0 ? Math.min(10, Math.max(0, rating)) : 0;
  if (safeRating === 0) {
    return "Not rated";
  }

  const filled = "★".repeat(safeRating);
  const empty = "☆".repeat(10 - safeRating);
  return `${filled}${empty} (${safeRating}/10)`;
}

export default function EventDetailsClient({ initialEvent, userId }: EventDetailsClientProps) {
  const router = useRouter();
  const [event, setEvent] = useState<MapEvent>(initialEvent);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPhotoActionRunning, setIsPhotoActionRunning] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [labelOptions, setLabelOptions] = useState<string[]>([]);
  const [visitCompanyOptions, setVisitCompanyOptions] = useState<string[]>([]);
  const [selectedRating, setSelectedRating] = useState<number | null>(initialEvent.rating ?? null);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [selectedLabels, setSelectedLabels] = useState<string[]>(initialEvent.labels ?? []);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EventFormState>({
    resolver: zodResolver(eventDraftValidationSchema),
    defaultValues: mapEventToFormState(initialEvent),
  });

  const samePinEventIds = useMemo(() => event.samePinEventIds ?? [event.id], [event.id, event.samePinEventIds]);
  const currentPinEventIndex = samePinEventIds.indexOf(event.id);
  const hasPinNavigation = samePinEventIds.length > 1 && currentPinEventIndex >= 0;
  const previousPinEventId = hasPinNavigation
    ? samePinEventIds[(currentPinEventIndex - 1 + samePinEventIds.length) % samePinEventIds.length]
    : null;
  const nextPinEventId = hasPinNavigation ? samePinEventIds[(currentPinEventIndex + 1) % samePinEventIds.length] : null;

  useEffect(() => {
    let active = true;

    Promise.all([fetchAllowedLabels(), fetchAllowedVisitCompanies()])
      .then(([labels, visitCompanies]) => {
        if (!active) {
          return;
        }

        setLabelOptions(labels);
        setVisitCompanyOptions(visitCompanies);
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setLabelOptions([]);
        setVisitCompanyOptions([]);
      });

    return () => {
      active = false;
    };
  }, []);

  function redirectMissingEvent() {
    router.replace("/?error=event-not-found");
  }

  function startEditing() {
    setSaveError(null);
    reset(mapEventToFormState(event));
    setSelectedRating(event.rating ?? null);
    setHoveredRating(null);
    setSelectedLabels(event.labels ?? []);
    setIsEditing(true);
  }

  function cancelEditing() {
    setSaveError(null);
    reset(mapEventToFormState(event));
    setSelectedRating(event.rating ?? null);
    setHoveredRating(null);
    setSelectedLabels(event.labels ?? []);
    setIsEditing(false);
  }

  async function saveChanges(values: EventFormState) {
    setSaveError(null);
    setIsSaving(true);

    try {
      const updatedEvent = await updateEvent({
        userId,
        eventId: event.id,
        name: values.name.trim(),
        startDate: values.startDate,
        endDate: values.endDate || undefined,
        description: values.description.trim(),
        rating: selectedRating,
        labels: selectedLabels,
        visitCompany: values.visitCompany,
      });

      const refreshedEvent = await fetchEventById(String(event.id), userId);
      setEvent(refreshedEvent);
      setIsEditing(false);
      reset(mapEventToFormState(refreshedEvent));
      setSelectedRating(refreshedEvent.rating ?? null);
      setSelectedLabels(refreshedEvent.labels ?? []);
      setHoveredRating(null);

      if (!updatedEvent) {
        setSaveError("Unable to save event. Please try again.");
      }
    } catch (error) {
      if (error instanceof Error && error.message === "EVENT_NOT_FOUND") {
        redirectMissingEvent();
        return;
      }

      setSaveError("Unable to save event. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAddPhotos(files: File[]) {
    if (files.length === 0) {
      return;
    }

    setSaveError(null);
    setIsPhotoActionRunning(true);

    try {
      await uploadEventPhotos(userId, event.id, files);
      const refreshedEvent = await fetchEventById(String(event.id), userId);
      setEvent(refreshedEvent);
    } catch (error) {
      if (error instanceof Error && error.message === "EVENT_NOT_FOUND") {
        redirectMissingEvent();
        return;
      }

      setSaveError("Unable to update photos. Please try again.");
    } finally {
      setIsPhotoActionRunning(false);
    }
  }

  async function handleDeletePhoto(photoId: number) {
    setSaveError(null);
    setIsPhotoActionRunning(true);

    try {
      const photos = await deleteEventPhoto(userId, event.id, photoId);
      setEvent((previous) => ({ ...previous, photos }));
    } catch (error) {
      if (error instanceof Error && error.message === "EVENT_NOT_FOUND") {
        redirectMissingEvent();
        return;
      }

      setSaveError("Unable to update photos. Please try again.");
    } finally {
      setIsPhotoActionRunning(false);
    }
  }

  async function handleSetPreviewPhoto(photoId: number) {
    setSaveError(null);
    setIsPhotoActionRunning(true);

    try {
      const photos = await setEventPreviewPhoto(userId, event.id, photoId);
      setEvent((previous) => ({ ...previous, photos }));
    } catch (error) {
      if (error instanceof Error && error.message === "EVENT_NOT_FOUND") {
        redirectMissingEvent();
        return;
      }

      setSaveError("Unable to update photos. Please try again.");
    } finally {
      setIsPhotoActionRunning(false);
    }
  }

  const dateText = formatEventDateRange(event.startDate, event.endDate) || "None";
  const labelsText = event.labels && event.labels.length > 0 ? event.labels.join(", ") : "None";
  const visitCompanyText = event.visitCompany?.trim() ? event.visitCompany : "None";

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

      <EventPhotosCarousel
        photos={event.photos ?? []}
        eventName={event.name ?? event.title}
        isUpdatingPhotos={isEditing ? isPhotoActionRunning || isSaving : false}
        onAddPhotos={isEditing ? handleAddPhotos : undefined}
        onDeletePhoto={isEditing ? handleDeletePhoto : undefined}
        onSetPreviewPhoto={isEditing ? handleSetPreviewPhoto : undefined}
      />

      {!isEditing && (
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
              <p aria-label="Event rating" className="text-base text-gray-900">
                {buildRatingText(event.rating)}
              </p>
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
              onClick={startEditing}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
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
        </>
      )}

      {isEditing && (
        <form className="space-y-4 rounded-lg border border-gray-200 bg-white p-5" onSubmit={handleSubmit(saveChanges)}>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-800" htmlFor="event-name">
              Name *
            </label>
            <input
              id="event-name"
              {...register("name")}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-900"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-800" htmlFor="event-start-date">
                Date *
              </label>
              <input
                id="event-start-date"
                type="date"
                {...register("startDate")}
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-900"
              />
              {errors.startDate && <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-800" htmlFor="event-end-date">
                End date (optional)
              </label>
              <input
                id="event-end-date"
                type="date"
                {...register("endDate")}
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-900"
              />
              {errors.endDate && <p className="mt-1 text-sm text-red-600">{errors.endDate.message}</p>}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-800" htmlFor="event-description">
              Description
            </label>
            <textarea
              id="event-description"
              {...register("description")}
              rows={3}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-900"
            />
          </div>

          <div>
            <p className="mb-1 text-sm font-medium text-slate-800">Rating</p>
            <div className="flex flex-wrap gap-1">
              {Array.from({ length: 10 }).map((_, index) => {
                const value = index + 1;
                const activeRating = hoveredRating ?? selectedRating ?? 0;
                const isActive = value <= activeRating;

                return (
                  <button
                    key={value}
                    type="button"
                    aria-label={`Set rating to ${value}`}
                    onMouseEnter={() => setHoveredRating(value)}
                    onMouseLeave={() => setHoveredRating(null)}
                    onClick={() => setSelectedRating(value)}
                    className={`text-xl leading-none ${isActive ? "text-yellow-400" : "text-slate-300"}`}
                  >
                    ★
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setSelectedRating(null)}
                className="ml-2 rounded border border-slate-300 px-2 py-1 text-xs text-slate-700"
              >
                Clear
              </button>
            </div>
          </div>

          <div>
            <p className="mb-1 text-sm font-medium text-slate-800">Labels</p>
            <div className="grid grid-cols-2 gap-2">
              {labelOptions.map((label) => {
                const isChecked = selectedLabels.includes(label);

                return (
                  <label key={label} className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(nextEvent) => {
                        const nextLabels = nextEvent.target.checked
                          ? [...selectedLabels, label]
                          : selectedLabels.filter((currentLabel) => currentLabel !== label);
                        setSelectedLabels(nextLabels);
                      }}
                    />
                    {label}
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-800" htmlFor="event-visit-company">
              Visit company
            </label>
            <select
              id="event-visit-company"
              {...register("visitCompany")}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-900"
            >
              <option value="">Select</option>
              {visitCompanyOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          {saveError && <p className="text-sm text-red-600">{saveError}</p>}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={cancelEditing}
              disabled={isSaving || isPhotoActionRunning}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || isPhotoActionRunning}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
