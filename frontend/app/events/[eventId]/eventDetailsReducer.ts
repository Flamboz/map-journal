import type { MapEvent, MapEventPhoto } from "../../map/api";

export type EventDetailsState = {
  event: MapEvent;
  isEditing: boolean;
  isSaving: boolean;
  isDeletingEvent: boolean;
  isDeleteModalOpen: boolean;
  isPhotoActionRunning: boolean;
  saveError: string | null;
  selectedRating: number | null;
  hoveredRating: number | null;
  selectedLabels: string[];
  startDateMin: string;
  draftPhotos?: MapEventPhoto[];
  photosToDelete?: string[];
};

type EventDetailsAction =
  | { type: "START_EDIT" }
  | { type: "CANCEL_EDIT" }
  | { type: "OPEN_DELETE_MODAL" }
  | { type: "CLOSE_DELETE_MODAL" }
  | { type: "SET_SAVE_ERROR"; payload: string | null }
  | { type: "SET_SAVING"; payload: boolean }
  | { type: "SET_DELETING_EVENT"; payload: boolean }
  | { type: "SET_PHOTO_ACTION_RUNNING"; payload: boolean }
  | { type: "SET_SELECTED_RATING"; payload: number | null }
  | { type: "SET_HOVERED_RATING"; payload: number | null }
  | { type: "SET_SELECTED_LABELS"; payload: string[] }
  | { type: "SET_START_DATE_MIN"; payload: string }
  | { type: "SET_EVENT"; payload: MapEvent }
  | { type: "SAVE_SUCCESS"; payload: MapEvent }
  | { type: "MARK_PHOTO_FOR_DELETION"; payload: string }
  | { type: "UNMARK_PHOTO_FOR_DELETION"; payload: string }
  | { type: "MARK_PHOTO_AS_PREVIEW"; payload: string };

function getEditFieldsFromEvent(event: MapEvent) {
  return {
    selectedRating: event.rating ?? null,
    hoveredRating: null,
    selectedLabels: event.labels ?? [],
    startDateMin: event.startDate ?? "",
  };
}

export function createInitialEventDetailsState(initialEvent: MapEvent): EventDetailsState {
  return {
    event: initialEvent,
    isEditing: false,
    isSaving: false,
    isDeletingEvent: false,
    isDeleteModalOpen: false,
    isPhotoActionRunning: false,
    saveError: null,
    ...getEditFieldsFromEvent(initialEvent),
    draftPhotos: undefined,
    photosToDelete: [],
  };
}

export function eventDetailsReducer(state: EventDetailsState, action: EventDetailsAction): EventDetailsState {
  switch (action.type) {
    case "START_EDIT":
      return {
        ...state,
        saveError: null,
        isEditing: true,
        ...getEditFieldsFromEvent(state.event),
        draftPhotos: state.event.photos ? [...state.event.photos] : [],
        photosToDelete: [],
      };
    case "CANCEL_EDIT":
      return {
        ...state,
        saveError: null,
        isEditing: false,
        ...getEditFieldsFromEvent(state.event),
        draftPhotos: undefined,
        photosToDelete: [],
      };
    case "OPEN_DELETE_MODAL":
      return {
        ...state,
        saveError: null,
        isDeleteModalOpen: true,
      };
    case "CLOSE_DELETE_MODAL":
      return {
        ...state,
        isDeleteModalOpen: false,
      };
    case "SET_SAVE_ERROR":
      return {
        ...state,
        saveError: action.payload,
      };
    case "SET_SAVING":
      return {
        ...state,
        isSaving: action.payload,
      };
    case "SET_DELETING_EVENT":
      return {
        ...state,
        isDeletingEvent: action.payload,
      };
    case "SET_PHOTO_ACTION_RUNNING":
      return {
        ...state,
        isPhotoActionRunning: action.payload,
      };
    case "SET_SELECTED_RATING":
      return {
        ...state,
        selectedRating: action.payload,
      };
    case "SET_HOVERED_RATING":
      return {
        ...state,
        hoveredRating: action.payload,
      };
    case "SET_SELECTED_LABELS":
      return {
        ...state,
        selectedLabels: action.payload,
      };
    case "SET_START_DATE_MIN":
      return {
        ...state,
        startDateMin: action.payload,
      };
    case "SET_EVENT":
      return {
        ...state,
        event: action.payload,
        // when event is set externally, clear any edit drafts
        draftPhotos: undefined,
        photosToDelete: [],
      };
    case "SAVE_SUCCESS":
      return {
        ...state,
        event: action.payload,
        isEditing: false,
        ...getEditFieldsFromEvent(action.payload),
        draftPhotos: undefined,
        photosToDelete: [],
      };
    case "MARK_PHOTO_FOR_DELETION": {
      const id = action.payload;
      const nextDraft = state.draftPhotos ? state.draftPhotos.filter((p) => p.id !== id) : [];
      const nextToDelete = Array.from(new Set([...(state.photosToDelete ?? []), id]));
      return { ...state, draftPhotos: nextDraft, photosToDelete: nextToDelete };
    }
    case "MARK_PHOTO_AS_PREVIEW": {
      const id = action.payload;
      if (!state.draftPhotos || state.draftPhotos.length === 0) return state;
      const found = state.draftPhotos.find((p) => p.id === id);
      if (!found) return state;
      const nextDraft = [found, ...state.draftPhotos.filter((p) => p.id !== id)];
      return { ...state, draftPhotos: nextDraft };
    }
    case "UNMARK_PHOTO_FOR_DELETION": {
      const id = action.payload;
      const nextToDelete = (state.photosToDelete ?? []).filter((p) => p !== id);
      return { ...state, photosToDelete: nextToDelete };
    }
    default:
      return state;
  }
}