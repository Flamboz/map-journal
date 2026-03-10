import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { sendError, sendServerError } from "../../utils/httpErrors";

type PlaceSearchQuerystring = {
  q?: string;
  lat?: string;
  lng?: string;
};

type NominatimSearchItem = {
  lat?: string;
  lon?: string;
  display_name?: string;
};

export function registerPlaceSearchRoute(fastify: FastifyInstance) {
  fastify.get(
    "/place-search",
    async (request: FastifyRequest<{ Querystring: PlaceSearchQuerystring }>, reply: FastifyReply) => {
      const query = request.query.q?.trim();
      if (!query) {
        return sendError(reply, 400, "INVALID_QUERY", "A non-empty query is required.");
      }

      const latitude = request.query.lat ? Number(request.query.lat) : null;
      const longitude = request.query.lng ? Number(request.query.lng) : null;
      const hasLatitude = latitude !== null && Number.isFinite(latitude);
      const hasLongitude = longitude !== null && Number.isFinite(longitude);

      const abortController = new AbortController();
      const timeoutHandle = setTimeout(() => abortController.abort(), 5000);

      try {
        const requestUrl = new URL("https://nominatim.openstreetmap.org/search");
        requestUrl.searchParams.set("format", "jsonv2");
        requestUrl.searchParams.set("q", query);
        requestUrl.searchParams.set("limit", "8");
        requestUrl.searchParams.set("addressdetails", "0");

        if (hasLatitude && hasLongitude) {
          requestUrl.searchParams.set("lat", String(latitude));
          requestUrl.searchParams.set("lon", String(longitude));
        }

        const upstreamResponse = await fetch(requestUrl.toString(), {
          signal: abortController.signal,
          headers: {
            Accept: "application/json",
            "User-Agent": "MapJournal/1.0",
          },
        });

        if (!upstreamResponse.ok) {
          request.log.error({ status: upstreamResponse.status }, "Place search upstream failed");
          return reply
            .status(502)
            .send({ error: "PLACE_SEARCH_UPSTREAM_ERROR", message: "Unable to search places right now." });
        }

        const payload = (await upstreamResponse.json()) as NominatimSearchItem[];
        const places = payload
          .map((item) => {
            const itemLatitude = item.lat ? Number(item.lat) : Number.NaN;
            const itemLongitude = item.lon ? Number(item.lon) : Number.NaN;
            const displayName = item.display_name?.trim() ?? "";

            if (!Number.isFinite(itemLatitude) || !Number.isFinite(itemLongitude) || !displayName) {
              return null;
            }

            return {
              displayName,
              lat: itemLatitude,
              lng: itemLongitude,
            };
          })
          .filter((item): item is { displayName: string; lat: number; lng: number } => item !== null);

        return reply.status(200).send({ places });
      } catch (error) {
        if (abortController.signal.aborted) {
          return sendError(reply, 504, "PLACE_SEARCH_TIMEOUT", "Place search timed out. Please try again.");
        }

        return sendServerError(request, reply, error);
      } finally {
        clearTimeout(timeoutHandle);
      }
    },
  );
}