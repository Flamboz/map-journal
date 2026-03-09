import { API_URL } from "../../lib/apiUrl";
import { createCachedFetcher } from "./apiCache";
import { createApiClientError } from "./apiErrors";

const fetchCachedLabels = createCachedFetcher(async () => {
  const response = await fetch(`${API_URL}/events/labels`);
  if (!response.ok) {
    throw createApiClientError("EVENT_LABELS_FETCH_FAILED");
  }

  const data = (await response.json()) as {
    labels?: string[];
  };

  return Array.isArray(data.labels) ? data.labels : [];
});

const fetchCachedVisitCompanies = createCachedFetcher(async () => {
  const response = await fetch(`${API_URL}/events/visit-companies`);
  if (!response.ok) {
    throw createApiClientError("EVENT_VISIT_COMPANIES_FETCH_FAILED");
  }

  const data = (await response.json()) as {
    visitCompanies?: string[];
  };

  return Array.isArray(data.visitCompanies) ? data.visitCompanies : [];
});

export async function fetchAllowedLabels(): Promise<string[]> {
  return fetchCachedLabels();
}

export async function fetchAllowedVisitCompanies(): Promise<string[]> {
  return fetchCachedVisitCompanies();
}