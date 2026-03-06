import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { all } from "../../db/sqlite";
import { parseUserId, UserQuerystring } from "./shared";

export function registerGetEventsRoute(fastify: FastifyInstance) {
  fastify.get(
    "/events",
    async (request: FastifyRequest<{ Querystring: UserQuerystring }>, reply: FastifyReply) => {
      const userId = parseUserId(request.query.userId);
      if (!userId) {
        return reply.status(400).send({ error: "INVALID_USER", message: "A valid userId is required." });
      }

      try {
        const events = (await all(
          "SELECT id, user_id, title, start_date, end_date, description, rating, labels, visit_company, lat, lng, created_at FROM events WHERE user_id = ? ORDER BY created_at DESC, id DESC",
          [userId],
        )) as Array<{
          id: number;
          user_id: number;
          title: string;
          start_date?: string | null;
          end_date?: string | null;
          description?: string | null;
          rating?: number | null;
          labels?: string | null;
          visit_company?: string | null;
          lat: number;
          lng: number;
          created_at: string;
        }>;

        const eventIds = events.map((event) => event.id);
        const photos =
          eventIds.length > 0
            ? ((await all(
                `SELECT id, event_id, file_path, created_at
                 FROM event_photos
                 WHERE event_id IN (${eventIds.map(() => "?").join(",")})
                 ORDER BY created_at ASC, id ASC`,
                eventIds,
              )) as Array<{ id: number; event_id: number; file_path: string; created_at: string }>)
            : [];

        const photosByEvent = new Map<number, Array<{ id: number; path: string; url: string; createdAt: string }>>();
        for (const photo of photos) {
          const list = photosByEvent.get(photo.event_id) ?? [];
          list.push({
            id: photo.id,
            path: photo.file_path,
            url: `/uploads/${photo.file_path}`,
            createdAt: photo.created_at,
          });
          photosByEvent.set(photo.event_id, list);
        }

        const normalizedEvents = events.map((event) => ({
          id: event.id,
          user_id: event.user_id,
          title: event.title,
          name: event.title,
          startDate: event.start_date ?? null,
          endDate: event.end_date ?? null,
          description: event.description ?? "",
          rating: event.rating ?? null,
          labels: event.labels ? JSON.parse(event.labels) : [],
          visitCompany: event.visit_company || "",
          lat: event.lat,
          lng: event.lng,
          created_at: event.created_at,
          photos: photosByEvent.get(event.id) ?? [],
        }));

        return reply.status(200).send({ events: normalizedEvents });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ error: "SERVER_ERROR", message: "Internal server error" });
      }
    },
  );
}
