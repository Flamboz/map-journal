"use client";

import { useEffect, useMemo, useReducer } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  deleteEvent,
  deleteEventPhoto,
  fetchEventById,
  setEventPreviewPhoto,
  type MapEvent,
  updateEvent,
  uploadEventPhotos,
} from "../../map/api";
import { isApiErrorCode } from "../../map/apiErrors";
import { eventDraftValidationSchema, formatEventDateRange } from "../../map/mapViewHelpers";
import type { EventFormState } from "../../map/mapViewTypes";
import { scrollToTop } from "../../../lib/scrollToTop";
import DeleteEventConfirmationModal from "./DeleteEventConfirmationModal";
import EventDetailsEditForm from "./EventDetailsEditForm";
import EventDetailsReadOnlyView from "./EventDetailsReadOnlyView";
import EventPhotosCarousel from "./EventPhotosCarousel";
import { mapEventToFormState } from "./eventDetailsFormState";
import { createInitialEventDetailsState, eventDetailsReducer } from "./eventDetailsReducer";
import { useEventDetailsOptions } from "./useEventDetailsOptions";

type EventDetailsClientProps = {
  initialEvent: MapEvent;
  authToken: string;
  currentUserEmail: string | null;
};

export default function EventDetailsClient({ initialEvent, authToken, currentUserEmail }: EventDetailsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, dispatch] = useReducer(eventDetailsReducer, initialEvent, createInitialEventDetailsState);
  const { labelOptions, visitCompanyOptions } = useEventDetailsOptions();

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EventFormState>({
    resolver: zodResolver(eventDraftValidationSchema),
    defaultValues: mapEventToFormState(initialEvent),
  });
  const visibility = watch("visibility");
  const sharedWithEmails = watch("sharedWithEmails");
  const canEdit = state.event.accessLevel === "owner";

  const samePinEventIds = useMemo(() => state.event.samePinEventIds ?? [state.event.id], [state.event.id, state.event.samePinEventIds]);
  const currentPinEventIndex = samePinEventIds.indexOf(state.event.id);
  const hasPinNavigation = samePinEventIds.length > 1 && currentPinEventIndex >= 0;
  const previousPinEventId = hasPinNavigation
    ? samePinEventIds[(currentPinEventIndex - 1 + samePinEventIds.length) % samePinEventIds.length]
    : null;
  const nextPinEventId = hasPinNavigation ? samePinEventIds[(currentPinEventIndex + 1) % samePinEventIds.length] : null;

  useEffect(() => {
    if (!canEdit || state.isEditing || searchParams?.get("edit") !== "true") {
      return;
    }

    dispatch({ type: "START_EDIT" });
    reset(mapEventToFormState(state.event));
    scrollToTop();
  }, [canEdit, reset, searchParams, state.event, state.isEditing]);

  function redirectMissingEvent() {
    router.replace("/?error=event-not-found");
  }

  function startEditing() {
    if (!canEdit) {
      return;
    }

    dispatch({ type: "START_EDIT" });
    reset(mapEventToFormState(state.event));
    scrollToTop();
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
      await deleteEvent(authToken, state.event.id);
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
      // First, apply any staged photo deletions made while editing
      const stagedDeletes = state.photosToDelete ?? [];
      if (stagedDeletes.length > 0) {
        dispatch({ type: "SET_PHOTO_ACTION_RUNNING", payload: true });
        try {
          for (const photoId of stagedDeletes) {
            await deleteEventPhoto(authToken, state.event.id, photoId);
          }
        } catch (error) {
          if (isApiErrorCode(error, "EVENT_NOT_FOUND")) {
            redirectMissingEvent();
            return;
          }

          dispatch({ type: "SET_SAVE_ERROR", payload: "Unable to update attachments. Please try again." });
          return;
        } finally {
          dispatch({ type: "SET_PHOTO_ACTION_RUNNING", payload: false });
        }
      }

      // Next, apply any staged preview change (draftPhotos[0] moved)
      const stagedPreviewId = state.draftPhotos && state.draftPhotos.length > 0 ? state.draftPhotos[0].id : null;
      const currentPreviewId = (state.event.photos && state.event.photos.length > 0 ? state.event.photos[0].id : null) ?? null;
      if (stagedPreviewId && stagedPreviewId !== currentPreviewId) {
        dispatch({ type: "SET_PHOTO_ACTION_RUNNING", payload: true });
        try {
          await setEventPreviewPhoto(authToken, state.event.id, stagedPreviewId);
        } catch (error) {
          if (isApiErrorCode(error, "EVENT_NOT_FOUND")) {
            redirectMissingEvent();
            return;
          }

          dispatch({ type: "SET_SAVE_ERROR", payload: "Unable to update attachments. Please try again." });
          return;
        } finally {
          dispatch({ type: "SET_PHOTO_ACTION_RUNNING", payload: false });
        }
      }

      const updatedEvent = await updateEvent(authToken, {
        eventId: state.event.id,
        name: values.name.trim(),
        startDate: values.startDate,
        endDate: values.endDate || undefined,
        description: values.description.trim(),
        rating: state.selectedRating,
        labels: state.selectedLabels,
        visitCompany: values.visitCompany,
        visibility: values.visibility,
        sharedWithEmails: values.sharedWithEmails,
      });

      const refreshedEvent = await fetchEventById(state.event.id, authToken);
      dispatch({ type: "SAVE_SUCCESS", payload: refreshedEvent });
      reset(mapEventToFormState(refreshedEvent));

      // After a successful save, scroll the page to top so the user sees the read-only view
      scrollToTop();

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
      await uploadEventPhotos(authToken, state.event.id, files);
      const refreshedEvent = await fetchEventById(state.event.id, authToken);
      dispatch({ type: "SET_EVENT", payload: refreshedEvent });
    } catch (error) {
      if (isApiErrorCode(error, "EVENT_NOT_FOUND")) {
        redirectMissingEvent();
        return;
      }

      dispatch({ type: "SET_SAVE_ERROR", payload: "Unable to update attachments. Please try again." });
    } finally {
      dispatch({ type: "SET_PHOTO_ACTION_RUNNING", payload: false });
    }
  }

  async function handleDeletePhoto(photoId: string) {
    dispatch({ type: "SET_SAVE_ERROR", payload: null });
    dispatch({ type: "SET_PHOTO_ACTION_RUNNING", payload: true });

    // When editing, stage the deletion locally and do not call the API until save
    if (state.isEditing) {
      dispatch({ type: "MARK_PHOTO_FOR_DELETION", payload: photoId });
      dispatch({ type: "SET_PHOTO_ACTION_RUNNING", payload: false });
      return;
    }

    try {
      const photos = await deleteEventPhoto(authToken, state.event.id, photoId);
      dispatch({ type: "SET_EVENT", payload: { ...state.event, photos } });
    } catch (error) {
      if (isApiErrorCode(error, "EVENT_NOT_FOUND")) {
        redirectMissingEvent();
        return;
      }

      dispatch({ type: "SET_SAVE_ERROR", payload: "Unable to update attachments. Please try again." });
    } finally {
      dispatch({ type: "SET_PHOTO_ACTION_RUNNING", payload: false });
    }
  }

  async function handleSetPreviewPhoto(photoId: string) {
    dispatch({ type: "SET_SAVE_ERROR", payload: null });
    dispatch({ type: "SET_PHOTO_ACTION_RUNNING", payload: true });

    // When editing, stage the preview change locally and do not call the API until save
    if (state.isEditing) {
      dispatch({ type: "MARK_PHOTO_AS_PREVIEW", payload: photoId });
      dispatch({ type: "SET_PHOTO_ACTION_RUNNING", payload: false });
      return;
    }

    try {
      const photos = await setEventPreviewPhoto(authToken, state.event.id, photoId);
      dispatch({ type: "SET_EVENT", payload: { ...state.event, photos } });
    } catch (error) {
      if (isApiErrorCode(error, "EVENT_NOT_FOUND")) {
        redirectMissingEvent();
        return;
      }

      dispatch({ type: "SET_SAVE_ERROR", payload: "Unable to update attachments. Please try again." });
    } finally {
      dispatch({ type: "SET_PHOTO_ACTION_RUNNING", payload: false });
    }
  }

  const dateText = formatEventDateRange(state.event.startDate, state.event.endDate);
  const visitCompany = state.event.visitCompany;

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
        photos={(state.isEditing ? state.draftPhotos ?? state.event.photos : state.event.photos) ?? []}
        eventName={state.event.name ?? state.event.title}
        isUpdatingPhotos={canEdit && state.isEditing ? state.isPhotoActionRunning || state.isSaving : false}
        onAddPhotos={canEdit && state.isEditing ? handleAddPhotos : undefined}
        onDeletePhoto={canEdit && state.isEditing ? handleDeletePhoto : undefined}
        onSetPreviewPhoto={canEdit && state.isEditing ? handleSetPreviewPhoto : undefined}
      />

      {!state.isEditing && (
        <>
          <EventDetailsReadOnlyView
            event={state.event}
            dateText={dateText}
            visitCompany={visitCompany}
            canEdit={canEdit}
            isDeletingEvent={state.isDeletingEvent}
            onStartEditing={startEditing}
            onOpenDeleteModal={openDeleteModal}
          />
        </>
      )}

      {state.isEditing && canEdit && (
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
          authToken={authToken}
          currentUserEmail={currentUserEmail}
          visibility={visibility}
          sharedWithEmails={sharedWithEmails}
          onVisibilityChange={(nextVisibility) =>
            setValue("visibility", nextVisibility, { shouldDirty: true, shouldValidate: true })
          }
          onSharedWithEmailsChange={(nextSharedWithEmails) =>
            setValue("sharedWithEmails", nextSharedWithEmails, { shouldDirty: true, shouldValidate: true })
          }
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
