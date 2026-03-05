import * as z from "zod";
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
