"use client";

import { useCallback, useEffect, useMemo, useReducer } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { deleteEvent, type MapEvent } from "../../map/api";
import { isApiErrorCode } from "../../map/apiErrors";
import { eventDraftValidationSchema } from "../../map/mapViewHelpers";
import type { EventFormState } from "../../map/mapViewTypes";
import { scrollToTop } from "../../../lib/scrollToTop";
import DeleteEventConfirmationModal from "./DeleteEventConfirmationModal";
import EventDetailsEditForm from "./EventDetailsEditForm";
import EventPhotosCarousel from "./EventPhotosCarousel";
import { mapEventToFormState } from "./eventDetailsFormState";
import { createInitialEventDetailsState, eventDetailsReducer } from "./eventDetailsReducer";
import { useEventDetailsMutations } from "./useEventDetailsMutations";
import { useEventDetailsOptions } from "./useEventDetailsOptions";

type EventDetailsClientProps = {
  initialEvent: MapEvent;
  authToken: string;
  currentUserEmail: string | null;
  readOnlyContentId: string;
  mediaContentId: string;
};

export default function EventDetailsClient({
  initialEvent,
  authToken,
  currentUserEmail,
  readOnlyContentId,
  mediaContentId,
}: EventDetailsClientProps) {
  const pathname = usePathname();
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

  const clearEditSearchParam = useCallback(() => {
    if (!searchParams || searchParams.get("edit") !== "true") {
      return;
    }

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("edit");
    const nextQuery = nextParams.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  useEffect(() => {
    const mediaContent = document.getElementById(mediaContentId);
    if (!mediaContent) {
      return;
    }

    mediaContent.hidden = true;

    return () => {
      mediaContent.hidden = false;
    };
  }, [mediaContentId]);

  useEffect(() => {
    const readOnlyContent = document.getElementById(readOnlyContentId);
    if (!readOnlyContent) {
      return;
    }

    readOnlyContent.hidden = state.isEditing;

    return () => {
      readOnlyContent.hidden = false;
    };
  }, [readOnlyContentId, state.isEditing]);

  useEffect(() => {
    if (!canEdit || state.isEditing || searchParams?.get("edit") !== "true") {
      return;
    }

    dispatch({ type: "START_EDIT" });
    reset(mapEventToFormState(state.event));
    scrollToTop();
    clearEditSearchParam();
  }, [canEdit, clearEditSearchParam, reset, state.event, state.isEditing]);

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

  const { cancelEditing, saveChanges, handleAddPhotos, handleDeletePhoto, handleSetPreviewPhoto } = useEventDetailsMutations({
    authToken,
    state,
    dispatch,
    reset,
    onMissingEvent: redirectMissingEvent,
    onCancelSuccess: clearEditSearchParam,
    onSaveSuccess: () => {
      scrollToTop();
    },
  });

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

  const displayedPhotos = useMemo(
    () => (state.isEditing ? state.draftPhotos ?? state.event.photos : state.event.photos) ?? [],
    [state.draftPhotos, state.event.photos, state.isEditing],
  );
  const eventName = state.event.name ?? state.event.title;

  return (
    <section className="space-y-6">
      {!state.isEditing && (
        <>
          <EventPhotosCarousel photos={displayedPhotos} eventName={eventName} />

          {canEdit && (
            <div className="flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={openDeleteModal}
                disabled={state.isDeletingEvent}
                className="rounded-lg border border-red-200 bg-white px-4 py-3 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {state.isDeletingEvent ? "Deleting..." : "Delete event"}
              </button>

              <button
                type="button"
                onClick={startEditing}
                disabled={state.isDeletingEvent}
                className="rounded-full bg-slate-900 px-6 py-3 text-sm font-medium text-white hover:bg-slate-800"
              >
                Edit event
              </button>
            </div>
          )}

          {state.saveError && canEdit && <p className="text-sm text-red-600">{state.saveError}</p>}
        </>
      )}

      {state.isEditing && canEdit && (
        <>
          <EventPhotosCarousel
            photos={displayedPhotos}
            eventName={eventName}
            isUpdatingPhotos={state.isPhotoActionRunning || state.isSaving}
            onAddPhotos={handleAddPhotos}
            onDeletePhoto={handleDeletePhoto}
            onSetPreviewPhoto={handleSetPreviewPhoto}
          />

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
        </>
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
