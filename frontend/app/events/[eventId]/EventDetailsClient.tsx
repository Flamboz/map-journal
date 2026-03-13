"use client";

import { useEffect, useMemo, useReducer, useState } from "react";
import { useSearchParams } from "next/navigation";
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
import { isApiErrorCode } from "../../map/apiErrors";
import { formatLabelsText, formatVisitCompanyText } from "../../map/eventDisplay";
import { eventDraftValidationSchema, formatEventDateRange } from "../../map/mapViewHelpers";
import type { EventFormState } from "../../map/mapViewTypes";
import DeleteEventConfirmationModal from "./DeleteEventConfirmationModal";
import EventDetailsEditForm from "./EventDetailsEditForm";
import EventDetailsReadOnlyView from "./EventDetailsReadOnlyView";
import EventPhotosCarousel from "./EventPhotosCarousel";
import { createInitialEventDetailsState, eventDetailsReducer } from "./eventDetailsReducer";

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
  const searchParams = useSearchParams();
  const [state, dispatch] = useReducer(eventDetailsReducer, initialEvent, createInitialEventDetailsState);
  const [labelOptions, setLabelOptions] = useState<string[]>([]);
  const [visitCompanyOptions, setVisitCompanyOptions] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<EventFormState>({
    resolver: zodResolver(eventDraftValidationSchema),
    defaultValues: mapEventToFormState(initialEvent),
  });

  const samePinEventIds = useMemo(() => state.event.samePinEventIds ?? [state.event.id], [state.event.id, state.event.samePinEventIds]);
  const currentPinEventIndex = samePinEventIds.indexOf(state.event.id);
  const hasPinNavigation = samePinEventIds.length > 1 && currentPinEventIndex >= 0;
  const previousPinEventId = hasPinNavigation
    ? samePinEventIds[(currentPinEventIndex - 1 + samePinEventIds.length) % samePinEventIds.length]
    : null;
  const nextPinEventId = hasPinNavigation ? samePinEventIds[(currentPinEventIndex + 1) % samePinEventIds.length] : null;

  useEffect(() => {
    // If URL contains ?edit=true, start in edit mode.
    if (searchParams?.get("edit") === "true") {
      startEditing();
    }

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
    dispatch({ type: "START_EDIT" });
    reset(mapEventToFormState(state.event));
  }

  function cancelEditing() {
    dispatch({ type: "CANCEL_EDIT" });
    reset(mapEventToFormState(state.event));
  }

  function openDeleteModal() {
    dispatch({ type: "OPEN_DELETE_MODAL" });
  }

  function closeDeleteModal() {
    if (state.isDeletingEvent) {
      return;
    }

    dispatch({ type: "CLOSE_DELETE_MODAL" });
  }

  function handleStartDateChange(nextStartDate: string) {
    dispatch({ type: "SET_START_DATE_MIN", payload: nextStartDate });
    const currentEndDate = getValues("endDate");

    if (currentEndDate && nextStartDate && currentEndDate < nextStartDate) {
      setValue("endDate", "", { shouldValidate: true, shouldDirty: true });
    }
  }

  async function confirmDeleteEvent() {
    dispatch({ type: "SET_SAVE_ERROR", payload: null });
    dispatch({ type: "SET_DELETING_EVENT", payload: true });

    try {
      await deleteEvent(userId, state.event.id);
      router.push("/");
      router.refresh();
    } catch (error) {
      if (isApiErrorCode(error, "EVENT_NOT_FOUND")) {
        redirectMissingEvent();
        return;
      }

      dispatch({ type: "SET_SAVE_ERROR", payload: "Unable to delete event. Please try again." });
      dispatch({ type: "CLOSE_DELETE_MODAL" });
    } finally {
      dispatch({ type: "SET_DELETING_EVENT", payload: false });
    }
  }

  async function saveChanges(values: EventFormState) {
    dispatch({ type: "SET_SAVE_ERROR", payload: null });
    dispatch({ type: "SET_SAVING", payload: true });

    try {
      const updatedEvent = await updateEvent({
        userId,
        eventId: state.event.id,
        name: values.name.trim(),
        startDate: values.startDate,
        endDate: values.endDate || undefined,
        description: values.description.trim(),
        rating: state.selectedRating,
        labels: state.selectedLabels,
        visitCompany: values.visitCompany,
      });

      const refreshedEvent = await fetchEventById(state.event.id, userId);
      dispatch({ type: "SAVE_SUCCESS", payload: refreshedEvent });
      reset(mapEventToFormState(refreshedEvent));

      if (!updatedEvent) {
        dispatch({ type: "SET_SAVE_ERROR", payload: "Unable to save event. Please try again." });
      }
    } catch (error) {
      if (isApiErrorCode(error, "EVENT_NOT_FOUND")) {
        redirectMissingEvent();
        return;
      }

      dispatch({ type: "SET_SAVE_ERROR", payload: "Unable to save event. Please try again." });
    } finally {
      dispatch({ type: "SET_SAVING", payload: false });
    }
  }

  async function handleAddPhotos(files: File[]) {
    if (files.length === 0) {
      return;
    }

    dispatch({ type: "SET_SAVE_ERROR", payload: null });
    dispatch({ type: "SET_PHOTO_ACTION_RUNNING", payload: true });

    try {
      await uploadEventPhotos(userId, state.event.id, files);
      const refreshedEvent = await fetchEventById(state.event.id, userId);
      dispatch({ type: "SET_EVENT", payload: refreshedEvent });
    } catch (error) {
      if (isApiErrorCode(error, "EVENT_NOT_FOUND")) {
        redirectMissingEvent();
        return;
      }

      dispatch({ type: "SET_SAVE_ERROR", payload: "Unable to update photos. Please try again." });
    } finally {
      dispatch({ type: "SET_PHOTO_ACTION_RUNNING", payload: false });
    }
  }

  async function handleDeletePhoto(photoId: string) {
    dispatch({ type: "SET_SAVE_ERROR", payload: null });
    dispatch({ type: "SET_PHOTO_ACTION_RUNNING", payload: true });

    try {
      const photos = await deleteEventPhoto(userId, state.event.id, photoId);
      dispatch({ type: "SET_EVENT", payload: { ...state.event, photos } });
    } catch (error) {
      if (isApiErrorCode(error, "EVENT_NOT_FOUND")) {
        redirectMissingEvent();
        return;
      }

      dispatch({ type: "SET_SAVE_ERROR", payload: "Unable to update photos. Please try again." });
    } finally {
      dispatch({ type: "SET_PHOTO_ACTION_RUNNING", payload: false });
    }
  }

  async function handleSetPreviewPhoto(photoId: string) {
    dispatch({ type: "SET_SAVE_ERROR", payload: null });
    dispatch({ type: "SET_PHOTO_ACTION_RUNNING", payload: true });

    try {
      const photos = await setEventPreviewPhoto(userId, state.event.id, photoId);
      dispatch({ type: "SET_EVENT", payload: { ...state.event, photos } });
    } catch (error) {
      if (isApiErrorCode(error, "EVENT_NOT_FOUND")) {
        redirectMissingEvent();
        return;
      }

      dispatch({ type: "SET_SAVE_ERROR", payload: "Unable to update photos. Please try again." });
    } finally {
      dispatch({ type: "SET_PHOTO_ACTION_RUNNING", payload: false });
    }
  }

  const dateText = formatEventDateRange(state.event.startDate, state.event.endDate) || "None";
  const labelsText = formatLabelsText(state.event.labels);
  const visitCompanyText = formatVisitCompanyText(state.event.visitCompany);

  return (
    <section className="mx-auto w-full max-w-3xl space-y-6 p-6">
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
        photos={state.event.photos ?? []}
        eventName={state.event.name ?? state.event.title}
        isUpdatingPhotos={state.isEditing ? state.isPhotoActionRunning || state.isSaving : false}
        onAddPhotos={state.isEditing ? handleAddPhotos : undefined}
        onDeletePhoto={state.isEditing ? handleDeletePhoto : undefined}
        onSetPreviewPhoto={state.isEditing ? handleSetPreviewPhoto : undefined}
      />

      {!state.isEditing && (
        <>
          <EventDetailsReadOnlyView
            event={state.event}
            dateText={dateText}
            labelsText={labelsText}
            visitCompanyText={visitCompanyText}
            isDeletingEvent={state.isDeletingEvent}
            onStartEditing={startEditing}
            onOpenDeleteModal={openDeleteModal}
          />
        </>
      )}

      {state.isEditing && (
        <EventDetailsEditForm
          register={register}
          errors={errors}
          labelOptions={labelOptions}
          visitCompanyOptions={visitCompanyOptions}
          selectedLabels={state.selectedLabels}
          setSelectedLabels={(labels) => dispatch({ type: "SET_SELECTED_LABELS", payload: labels })}
          selectedRating={state.selectedRating}
          setSelectedRating={(rating) => dispatch({ type: "SET_SELECTED_RATING", payload: rating })}
          hoveredRating={state.hoveredRating}
          setHoveredRating={(rating) => dispatch({ type: "SET_HOVERED_RATING", payload: rating })}
          startDateMin={state.startDateMin}
          onStartDateChange={handleStartDateChange}
          saveError={state.saveError}
          isSaving={state.isSaving}
          isPhotoActionRunning={state.isPhotoActionRunning}
          onCancel={cancelEditing}
          onSubmit={handleSubmit(saveChanges)}
        />
      )}

      {state.isDeleteModalOpen && (
        <DeleteEventConfirmationModal
          isDeletingEvent={state.isDeletingEvent}
          onCancel={closeDeleteModal}
          onConfirm={confirmDeleteEvent}
        />
      )}
    </section>
  );
}
