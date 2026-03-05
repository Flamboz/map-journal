import { Icon, type LatLngExpression } from "leaflet";
import type { EventFormState } from "./mapViewTypes";

export const WORLD_CENTER: LatLngExpression = [20, 0];
export const WORLD_ZOOM = 2;

export const MARKER_ICON = new Icon({
  iconUrl: "/leaflet/pin.svg",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -28],
});

export const EMPTY_FORM_STATE: EventFormState = {
  name: "",
  startDate: "",
  endDate: "",
  description: "",
  rating: null,
  labels: [],
  visitCompany: "",
  photos: [],
};
