import { run } from "../db/sqlite";

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

type ReverseGeocodeResult = {
  address: ReverseGeocodeAddress | null;
  city: string;
};

let lastRequestAt = 0;
const MIN_INTERVAL_MS = 1100; // 1.1s between requests to be safe

function coordKey(lat: number, lon: number) {
  return `${lat.toFixed(6)},${lon.toFixed(6)}`;
}

function extractCity(address: ReverseGeocodeAddress | null, displayName: unknown): string {
  if (address) {
    const directCity = address.city ?? address.town ?? address.village ?? address.municipality;
    if (directCity) {
      return directCity;
    }

    if (address.suburb) {
      return address.suburb;
    }

    if (address.country) {
      return address.country;
    }
  }

  if (typeof displayName === "string" && displayName.length > 0) {
    const parts = displayName
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
    if (parts.length > 0) {
      return parts[0];
    }
  }

  return "";
}

function normalizeAddress(address: unknown): ReverseGeocodeAddress | null {
  if (!address || typeof address !== "object") {
    return null;
  }

  const rawAddress = address as Record<string, unknown>;
  const normalizedAddress: ReverseGeocodeAddress = {
    road: typeof rawAddress.road === "string" ? rawAddress.road : undefined,
    pedestrian: typeof rawAddress.pedestrian === "string" ? rawAddress.pedestrian : undefined,
    footway: typeof rawAddress.footway === "string" ? rawAddress.footway : undefined,
    suburb: typeof rawAddress.suburb === "string" ? rawAddress.suburb : undefined,
    house_number: typeof rawAddress.house_number === "string" ? rawAddress.house_number : undefined,
    city: typeof rawAddress.city === "string" ? rawAddress.city : undefined,
    town: typeof rawAddress.town === "string" ? rawAddress.town : undefined,
    village: typeof rawAddress.village === "string" ? rawAddress.village : undefined,
    municipality: typeof rawAddress.municipality === "string" ? rawAddress.municipality : undefined,
    country: typeof rawAddress.country === "string" ? rawAddress.country : undefined,
  };

  return Object.values(normalizedAddress).some((value) => typeof value === "string" && value.length > 0) ? normalizedAddress : null;
}

async function reverseGeocode(lat: number, lon: number): Promise<ReverseGeocodeResult> {
  const key = coordKey(lat, lon);
  const now = Date.now();
  const waitMs = Math.max(0, MIN_INTERVAL_MS - (now - lastRequestAt));
  if (waitMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  const provider = process.env.GEOCODER_PROVIDER ?? "nominatim";
  const fetchFn = globalThis.fetch;
  if (typeof fetchFn !== "function") {
    return { address: null, city: "" };
  }

  let address: ReverseGeocodeAddress | null = null;
  let displayName: unknown = null;

  if (provider === "nominatim") {
    const abortController = new AbortController();
    const timeoutHandle = setTimeout(() => abortController.abort(), 5000);

    try {
      const url = new URL("https://nominatim.openstreetmap.org/reverse");
      url.searchParams.set("format", "jsonv2");
      url.searchParams.set("lat", String(lat));
      url.searchParams.set("lon", String(lon));
      url.searchParams.set("accept-language", "en");

      const ua = process.env.GEOCODER_USER_AGENT ?? "MapJournal/1.0";
      const referer = process.env.GEOCODER_REFERER;
      const headers: Record<string, string> = { Accept: "application/json", "User-Agent": ua };
      if (referer) {
        headers.Referer = referer;
      }

      const response = await fetchFn(url.toString(), { headers, signal: abortController.signal });
      lastRequestAt = Date.now();
      if (!response.ok) {
        return { address: null, city: "" };
      }

      const json = (await response.json().catch(() => null)) as { address?: unknown; display_name?: unknown } | null;
      address = normalizeAddress(json?.address);
      displayName = json?.display_name ?? null;
    } finally {
      clearTimeout(timeoutHandle);
    }
  } else if (provider === "locationiq") {
    const geocoderKey = process.env.GEOCODER_KEY;
    if (!geocoderKey) {
      return { address: null, city: "" };
    }

    const url = new URL("https://us1.locationiq.com/v1/reverse.php");
    url.searchParams.set("key", geocoderKey);
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("lon", String(lon));
    url.searchParams.set("format", "json");

    const ua = process.env.GEOCODER_USER_AGENT ?? "MapJournal/1.0";
    const abortController = new AbortController();
    const timeoutHandle = setTimeout(() => abortController.abort(), 5000);

    try {
      const response = await fetchFn(url.toString(), {
        headers: { Accept: "application/json", "User-Agent": ua },
        signal: abortController.signal,
      });
      lastRequestAt = Date.now();
      if (!response.ok) {
        return { address: null, city: "" };
      }

      const json = (await response.json().catch(() => null)) as { address?: unknown; display_name?: unknown } | null;
      address = normalizeAddress(json?.address);
      displayName = json?.display_name ?? null;
    } finally {
      clearTimeout(timeoutHandle);
    }
  }

  const city = extractCity(address, displayName);

  try {
    await run(`INSERT OR REPLACE INTO geocode_cache (key, lat, lon, city, updated_at) VALUES (?, ?, ?, ?, datetime('now'))`, [
      key,
      lat,
      lon,
      city,
    ]);
  } catch {
    // ignore cache write errors
  }

  return { address, city };
}

export async function reverseGeocodeCity(lat: number, lon: number): Promise<string> {
  try {
    return (await reverseGeocode(lat, lon)).city;
  } catch {
    return "";
  }
}

export async function reverseGeocodeAddress(lat: number, lon: number): Promise<ReverseGeocodeAddress | null> {
  try {
    return (await reverseGeocode(lat, lon)).address;
  } catch {
    return null;
  }
}
