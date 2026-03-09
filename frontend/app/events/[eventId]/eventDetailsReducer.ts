import type { MapEvent } from "../../map/api";

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
  | { type: "SAVE_SUCCESS"; payload: MapEvent };

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
      };
    case "CANCEL_EDIT":
      return {
        ...state,
        saveError: null,
        isEditing: false,
        ...getEditFieldsFromEvent(state.event),
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
      };
    case "SAVE_SUCCESS":
      return {
        ...state,
        event: action.payload,
        isEditing: false,
        ...getEditFieldsFromEvent(action.payload),
      };
    default:
      return state;
  }
}