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
  house_number?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  country?: string;
};
