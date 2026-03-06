import * as z from "zod";
import type { MapEvent } from "./api";
import type { ReverseGeocodeAddress } from "./mapViewTypes";

export function formatShortAddress(address?: ReverseGeocodeAddress): string | null {
  if (!address) {
    return null;
  }

  const street = address.road ?? address.pedestrian ?? address.footway;
  const buildingNumber = address.house_number;
  const city = address.city ?? address.town ?? address.village ?? address.municipality;
  const country = address.country;

  const streetLine = street && buildingNumber ? `${street}, ${buildingNumber}` : street ?? buildingNumber ?? "";
  const parts = [streetLine, city, country].filter((part): part is string => Boolean(part));

  return parts.length > 0 ? parts.join(", ") : null;
}

export const eventDraftValidationSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required."),
    startDate: z.string().min(1, "Date or date range is required."),
    endDate: z.string(),
    description: z.string(),
    rating: z.number().int().min(1).max(10).nullable(),
    labels: z.array(z.string()),
    visitCompany: z.string(),
    photos: z.array(z.any()),
  })
  .refine((values) => !values.endDate || values.endDate >= values.startDate, {
    path: ["endDate"],
    message: "End date cannot be before start date.",
  });

export type MapEventGroup = {
  id: string;
  lat: number;
  lng: number;
  events: MapEvent[];
};

const EARTH_RADIUS_METERS = 6_371_000;

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

export function getDistanceMeters(
  pointA: { lat: number; lng: number },
  pointB: { lat: number; lng: number },
): number {
  const latitudeDelta = toRadians(pointB.lat - pointA.lat);
  const longitudeDelta = toRadians(pointB.lng - pointA.lng);
  const latA = toRadians(pointA.lat);
  const latB = toRadians(pointB.lat);

  const a =
    Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
    Math.cos(latA) * Math.cos(latB) * Math.sin(longitudeDelta / 2) * Math.sin(longitudeDelta / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
}

export function groupEventsByDistance(events: MapEvent[], thresholdMeters: number): MapEventGroup[] {
  const groups: MapEventGroup[] = [];

  for (const event of events) {
    const eventPoint = { lat: event.lat, lng: event.lng };
    const group = groups.find((candidateGroup) =>
      candidateGroup.events.some((groupEvent) => {
        const groupPoint = { lat: groupEvent.lat, lng: groupEvent.lng };
        return getDistanceMeters(eventPoint, groupPoint) <= thresholdMeters;
      }),
    );

    if (!group) {
      groups.push({
        id: `event-group-${event.id}`,
        lat: event.lat,
        lng: event.lng,
        events: [event],
      });
      continue;
    }

    group.events.push(event);
    const total = group.events.length;
    group.lat = group.events.reduce((sum, current) => sum + current.lat, 0) / total;
    group.lng = group.events.reduce((sum, current) => sum + current.lng, 0) / total;
  }

  return groups;
}

export function formatEventDateRange(startDate?: string | null, endDate?: string | null): string {
  if (!startDate) {
    return "";
  }

  if (endDate) {
    return `${startDate} – ${endDate}`;
  }

  return startDate;
}

export function formatRatingStars(rating?: number | null): string {
  const safeRating = Math.max(0, Math.min(10, rating ?? 0));
  const filled = "★".repeat(safeRating);
  const empty = "☆".repeat(10 - safeRating);
  return `${filled}${empty}`;
}
