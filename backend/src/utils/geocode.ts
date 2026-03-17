import { run } from "../db/sqlite";

let lastRequestAt = 0;
const MIN_INTERVAL_MS = 1100; // 1.1s between requests to be safe

function coordKey(lat: number, lon: number) {
  return `${lat.toFixed(6)},${lon.toFixed(6)}`;
}

export async function reverseGeocodeCity(lat: number, lon: number): Promise<string> {
  try {
    const key = coordKey(lat, lon);

    const now = Date.now();
    const waitMs = Math.max(0, MIN_INTERVAL_MS - (now - lastRequestAt));
    if (waitMs > 0) await new Promise((r) => setTimeout(r, waitMs));

    const provider = process.env.GEOCODER_PROVIDER ?? "nominatim";
    const fetchFn = (globalThis as any).fetch;
    if (typeof fetchFn !== "function") return "";

    let city = "";

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
        if (referer) headers["Referer"] = referer;

        const res = await fetchFn(url.toString(), { headers, signal: abortController.signal });
        lastRequestAt = Date.now();
        if (!res.ok) {
          return "";
        }

        const json = await res.json().catch(() => null);
        const addr = json?.address;

        city = addr?.city ?? addr?.town ?? addr?.village ?? addr?.municipality ?? addr?.county ?? "";
        if (!city) {
          city = addr?.hamlet ?? addr?.locality ?? addr?.suburb ?? addr?.neighbourhood ?? addr?.state_district ?? addr?.region ?? addr?.state ?? addr?.country ?? "";
        }
        if (!city) {
          const display = json?.display_name ?? "";
          if (typeof display === "string" && display.length > 0) {
            const parts = display.split(",").map((p: string) => p.trim()).filter(Boolean);
            if (parts.length > 0) city = parts[0];
          }
        }
      } finally {
        clearTimeout(timeoutHandle);
      }
    } else if (provider === "locationiq") {
      const key = process.env.GEOCODER_KEY;
      if (!key) return "";
      const url = new URL("https://us1.locationiq.com/v1/reverse.php");
      url.searchParams.set("key", key);
      url.searchParams.set("lat", String(lat));
      url.searchParams.set("lon", String(lon));
      url.searchParams.set("format", "json");

      const ua = process.env.GEOCODER_USER_AGENT ?? "MapJournal/1.0";
      const abortController = new AbortController();
      const timeoutHandle = setTimeout(() => abortController.abort(), 5000);

      try {
        const res = await fetchFn(url.toString(), { headers: { Accept: "application/json", "User-Agent": ua }, signal: abortController.signal });
        lastRequestAt = Date.now();
        if (!res.ok) return "";
        const json = await res.json().catch(() => null);
        const addr = json?.address;
        city = addr?.city ?? addr?.town ?? addr?.village ?? addr?.county ?? "";
        if (!city) city = json?.display_name?.split(",")?.[0] ?? "";
      } finally {
        clearTimeout(timeoutHandle);
      }
    }

    city = city || "";

    try {
      await run(`INSERT OR REPLACE INTO geocode_cache (key, lat, lon, city, updated_at) VALUES (?, ?, ?, ?, datetime('now'))`, [key, lat, lon, city]);
    } catch (err) {
      // ignore cache write errors
    }

    return city;
  } catch (err) {
    return "";
  }
}
