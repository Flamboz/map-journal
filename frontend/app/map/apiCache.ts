export function createCachedFetcher<T>(loader: () => Promise<T>): () => Promise<T> {
  let cachedValue: T | null = null;
  let inFlightRequest: Promise<T> | null = null;

  return async function fetchCached(): Promise<T> {
    if (cachedValue !== null) {
      return cachedValue;
    }

    if (inFlightRequest) {
      return inFlightRequest;
    }

    inFlightRequest = loader()
      .then((value) => {
        cachedValue = value;
        return value;
      })
      .finally(() => {
        inFlightRequest = null;
      });

    return inFlightRequest;
  };
}