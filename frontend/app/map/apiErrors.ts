export type ApiErrorCode =
  | "EVENT_LABELS_FETCH_FAILED"
  | "EVENT_VISIT_COMPANIES_FETCH_FAILED"
  | "MAP_POSITION_FETCH_FAILED"
  | "PLACE_SEARCH_FAILED"
  | "EVENTS_FETCH_FAILED"
  | "EVENT_NOT_FOUND"
  | "EVENT_CREATE_FAILED"
  | "EVENT_UPDATE_FAILED"
  | "EVENT_DELETE_FAILED"
  | "EVENT_PHOTOS_UPLOAD_FAILED"
  | "EVENT_PHOTO_NOT_FOUND"
  | "EVENT_PHOTO_DELETE_FAILED"
  | "EVENT_PREVIEW_PHOTO_UPDATE_FAILED";

export class ApiClientError extends Error {
  code: ApiErrorCode;

  constructor(code: ApiErrorCode) {
    super(code);
    this.name = "ApiClientError";
    this.code = code;
  }
}

export function createApiClientError(code: ApiErrorCode): ApiClientError {
  return new ApiClientError(code);
}

export function isApiErrorCode(error: unknown, code: ApiErrorCode): boolean {
  return error instanceof ApiClientError && error.code === code;
}