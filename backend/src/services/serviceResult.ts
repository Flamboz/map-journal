export type ServiceError = {
  statusCode: number;
  error: string;
  message: string;
};

export type ServiceResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: ServiceError };

export function success<T>(value: T): ServiceResult<T> {
  return { ok: true, value };
}

export function failure(statusCode: number, error: string, message: string): ServiceResult<never> {
  return {
    ok: false,
    error: {
      statusCode,
      error,
      message,
    },
  };
}
