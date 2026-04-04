import type { EventVisibility } from "./apiTypes";
import type { LatLngExpression } from "leaflet";

export type VisitCompany = string;

export type EventFormState = {
  name: string;
  startDate: string;
  endDate: string;
  description: string;
  rating: number | null;
  labels: string[];
  visitCompany: VisitCompany;
  photos: File[];
  visibility: EventVisibility;
  sharedWithEmails: string[];
};

export type DraftSaveStatus =
  | {
      phase: "creating";
      totalFiles: number;
    }
  | {
      phase: "uploading";
      totalFiles: number;
      completedFiles: number;
      currentFileName: string;
      progressPercent: number;
    };

export type FormErrors = {
  name?: string;
  startDate?: string;
  endDate?: string;
  save?: string;
};

export type CenterState = {
  center: LatLngExpression;
  zoom: number;
};

export type ReverseGeocodeAddress = {
  road?: string;
  pedestrian?: string;
  footway?: string;
  suburb?: string;
  house_number?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  country?: string;
};
