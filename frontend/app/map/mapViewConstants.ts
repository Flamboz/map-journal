import { DivIcon, Icon, type LatLngExpression } from "leaflet";
import type { EventFormState } from "./mapViewTypes";

export const WORLD_CENTER: LatLngExpression = [20, 0];
export const WORLD_ZOOM = 2;
export const PIN_GROUP_DISTANCE_METERS = 20;

export const MARKER_ICON = new Icon({
  iconUrl: "/leaflet/pin.svg",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -28],
});

export const DRAFT_MARKER_ICON = new Icon({
  iconUrl: "/leaflet/draft-pin.svg",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -28],
});

export function createMarkerIconWithCount(eventCount: number): DivIcon {
  const safeCount = Math.max(1, Math.floor(eventCount));

  return new DivIcon({
    className: "",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -28],
    html: `
      <div style="position:relative;width:32px;height:32px;">
        <img src="/leaflet/pin.svg" alt="" style="width:32px;height:32px;display:block;" />
        <span style="position:absolute;top:-4px;right:-6px;min-width:16px;height:16px;padding:0 4px;border-radius:999px;background:var(--cluster-badge-bg);color:var(--cluster-badge-text);font-size:10px;line-height:16px;font-weight:700;text-align:center;box-sizing:border-box;">
          ${safeCount}
        </span>
      </div>
    `,
  });
}

export const EMPTY_FORM_STATE: EventFormState = {
  name: "",
  startDate: "",
  endDate: "",
  description: "",
  rating: null,
  labels: [],
  visitCompany: "",
  photos: [],
  visibility: "private",
  sharedWithEmails: [],
};
