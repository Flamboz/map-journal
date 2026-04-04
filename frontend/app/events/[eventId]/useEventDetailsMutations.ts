import { useCallback } from "react";
import type { UseFormReset } from "react-hook-form";
import {
  deleteEventPhoto,
  type MapEvent,
  setEventPreviewPhoto,
  updateEvent,
  uploadEventPhotos,
} from "../../map/api";
import { isApiErrorCode } from "../../map/apiErrors";
import type { EventFormState } from "../../map/mapViewTypes";
import { mapEventToFormState } from "./eventDetailsFormState";
import type { EventDetailsAction, EventDetailsState } from "./eventDetailsReducer";

type Dispatch = (action: EventDetailsAction) => void;

type UseEventDetailsMutationsArgs = {
  authToken: string;
  state: EventDetailsState;
  dispatch: Dispatch;
  reset: UseFormReset<EventFormState>;
  onMissingEvent: () => void;
  onCancelSuccess?: () => void;
  onSaveSuccess?: (event: MapEvent) => void;
};

type UseEventDetailsMutationsResult = {
  cancelEditing: () => Promise<void>;
  saveChanges: (values: EventFormState) => Promise<void>;
  handleAddPhotos: (files: File[]) => Promise<void>;
  handleDeletePhoto: (photoId: string) => Promise<void>;
  handleSetPreviewPhoto: (photoId: string) => Promise<void>;
};

const ATTACHMENT_ERROR_MESSAGE = "Unable to update attachments. Please try again.";
const SAVE_ERROR_MESSAGE = "Unable to save event. Please try again.";

function isMissingEventError(error: unknown): boolean {
  return isApiErrorCode(error, "EVENT_NOT_FOUND");
}

export function useEventDetailsMutations({
  authToken,
  state,
  dispatch,
  reset,
  onMissingEvent,
  onCancelSuccess,
  onSaveSuccess,
}: UseEventDetailsMutationsArgs): UseEventDetailsMutationsResult {
  const cancelEditing = useCallback(async () => {
    dispatch({ type: "SET_SAVE_ERROR", payload: null });

    if (state.uploadedPhotoIds.length > 0) {
      dispatch({ type: "SET_PHOTO_ACTION_RUNNING", payload: true });
    }

    try {
      for (const photoId of state.uploadedPhotoIds) {
        await deleteEventPhoto(authToken, state.event.id, photoId);
      }

      dispatch({ type: "CANCEL_EDIT" });
      reset(mapEventToFormState(state.event));
      onCancelSuccess?.();
    } catch (error) {
      if (isMissingEventError(error)) {
        onMissingEvent();
        return;
      }

      dispatch({ type: "SET_SAVE_ERROR", payload: ATTACHMENT_ERROR_MESSAGE });
    } finally {
      dispatch({ type: "SET_PHOTO_ACTION_RUNNING", payload: false });
    }
  }, [authToken, dispatch, onCancelSuccess, onMissingEvent, reset, state]);

  const saveChanges = useCallback(
    async (values: EventFormState) => {
      dispatch({ type: "SET_SAVE_ERROR", payload: null });
      dispatch({ type: "SET_SAVING", payload: true });

      try {
        const stagedPreviewId = state.draftPhotos?.[0]?.id ?? null;
        const currentPreviewId = state.event.photos?.[0]?.id ?? null;

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
          photoIdsToDelete: state.photosToDelete ?? [],
          previewPhotoId: stagedPreviewId && stagedPreviewId !== currentPreviewId ? stagedPreviewId : undefined,
        });

        dispatch({ type: "SAVE_SUCCESS", payload: updatedEvent });
        reset(mapEventToFormState(updatedEvent));
        onSaveSuccess?.(updatedEvent);
      } catch (error) {
        if (isMissingEventError(error)) {
          onMissingEvent();
          return;
        }

        dispatch({ type: "SET_SAVE_ERROR", payload: SAVE_ERROR_MESSAGE });
      } finally {
        dispatch({ type: "SET_SAVING", payload: false });
      }
    },
    [authToken, dispatch, onMissingEvent, onSaveSuccess, reset, state],
  );

  const handleAddPhotos = useCallback(
    async (files: File[]) => {
      if (files.length === 0) {
        return;
      }

      dispatch({ type: "SET_SAVE_ERROR", payload: null });
      dispatch({ type: "SET_PHOTO_ACTION_RUNNING", payload: true });

      try {
        const photos = await uploadEventPhotos(authToken, state.event.id, files);
        dispatch({ type: "ADD_UPLOADED_PHOTOS", payload: photos });
      } catch (error) {
        if (isMissingEventError(error)) {
          onMissingEvent();
          return;
        }

        dispatch({ type: "SET_SAVE_ERROR", payload: ATTACHMENT_ERROR_MESSAGE });
      } finally {
        dispatch({ type: "SET_PHOTO_ACTION_RUNNING", payload: false });
      }
    },
    [authToken, dispatch, onMissingEvent, state.event],
  );

  const handleDeletePhoto = useCallback(
    async (photoId: string) => {
      dispatch({ type: "SET_SAVE_ERROR", payload: null });
      dispatch({ type: "SET_PHOTO_ACTION_RUNNING", payload: true });

      if (state.isEditing) {
        dispatch({ type: "MARK_PHOTO_FOR_DELETION", payload: photoId });
        dispatch({ type: "SET_PHOTO_ACTION_RUNNING", payload: false });
        return;
      }

      try {
        const photos = await deleteEventPhoto(authToken, state.event.id, photoId);
        dispatch({ type: "SET_EVENT", payload: { ...state.event, photos } });
      } catch (error) {
        if (isMissingEventError(error)) {
          onMissingEvent();
          return;
        }

        dispatch({ type: "SET_SAVE_ERROR", payload: ATTACHMENT_ERROR_MESSAGE });
      } finally {
        dispatch({ type: "SET_PHOTO_ACTION_RUNNING", payload: false });
      }
    },
    [authToken, dispatch, onMissingEvent, state.event, state.isEditing],
  );

  const handleSetPreviewPhoto = useCallback(
    async (photoId: string) => {
      dispatch({ type: "SET_SAVE_ERROR", payload: null });
      dispatch({ type: "SET_PHOTO_ACTION_RUNNING", payload: true });

      if (state.isEditing) {
        dispatch({ type: "MARK_PHOTO_AS_PREVIEW", payload: photoId });
        dispatch({ type: "SET_PHOTO_ACTION_RUNNING", payload: false });
        return;
      }

      try {
        const photos = await setEventPreviewPhoto(authToken, state.event.id, photoId);
        dispatch({ type: "SET_EVENT", payload: { ...state.event, photos } });
      } catch (error) {
        if (isMissingEventError(error)) {
          onMissingEvent();
          return;
        }

        dispatch({ type: "SET_SAVE_ERROR", payload: ATTACHMENT_ERROR_MESSAGE });
      } finally {
        dispatch({ type: "SET_PHOTO_ACTION_RUNNING", payload: false });
      }
    },
    [authToken, dispatch, onMissingEvent, state.event, state.isEditing],
  );

  return {
    cancelEditing,
    saveChanges,
    handleAddPhotos,
    handleDeletePhoto,
    handleSetPreviewPhoto,
  };
}
