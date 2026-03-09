"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  deleteEvent,
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
import DeleteEventConfirmationModal from "./DeleteEventConfirmationModal";
import EventDetailsEditForm from "./EventDetailsEditForm";
import EventDetailsReadOnlyView from "./EventDetailsReadOnlyView";
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

export default function EventDetailsClient({ initialEvent, userId }: EventDetailsClientProps) {
  const router = useRouter();
  const [event, setEvent] = useState<MapEvent>(initialEvent);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingEvent, setIsDeletingEvent] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
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

  function openDeleteModal() {
    setSaveError(null);
    setIsDeleteModalOpen(true);
  }

  function closeDeleteModal() {
    if (isDeletingEvent) {
      return;
    }

    setIsDeleteModalOpen(false);
  }

  async function confirmDeleteEvent() {
    setSaveError(null);
    setIsDeletingEvent(true);

    try {
      await deleteEvent(userId, event.id);
      router.push("/");
      router.refresh();
    } catch (error) {
      if (error instanceof Error && error.message === "EVENT_NOT_FOUND") {
        redirectMissingEvent();
        return;
      }

      setSaveError("Unable to delete event. Please try again.");
      setIsDeleteModalOpen(false);
    } finally {
      setIsDeletingEvent(false);
    }
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

      const refreshedEvent = await fetchEventById(event.id, userId);
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
      const refreshedEvent = await fetchEventById(event.id, userId);
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

  async function handleDeletePhoto(photoId: string) {
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

  async function handleSetPreviewPhoto(photoId: string) {
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
          <EventDetailsReadOnlyView
            event={event}
            dateText={dateText}
            labelsText={labelsText}
            visitCompanyText={visitCompanyText}
            isDeletingEvent={isDeletingEvent}
            onStartEditing={startEditing}
            onOpenDeleteModal={openDeleteModal}
          />
        </>
      )}

      {isEditing && (
        <EventDetailsEditForm
          register={register}
          errors={errors}
          labelOptions={labelOptions}
          visitCompanyOptions={visitCompanyOptions}
          selectedLabels={selectedLabels}
          setSelectedLabels={setSelectedLabels}
          selectedRating={selectedRating}
          setSelectedRating={setSelectedRating}
          hoveredRating={hoveredRating}
          setHoveredRating={setHoveredRating}
          saveError={saveError}
          isSaving={isSaving}
          isPhotoActionRunning={isPhotoActionRunning}
          onCancel={cancelEditing}
          onSubmit={handleSubmit(saveChanges)}
        />
      )}

      {isDeleteModalOpen && (
        <DeleteEventConfirmationModal
          isDeletingEvent={isDeletingEvent}
          onCancel={closeDeleteModal}
          onConfirm={confirmDeleteEvent}
        />
      )}
    </section>
  );
}
