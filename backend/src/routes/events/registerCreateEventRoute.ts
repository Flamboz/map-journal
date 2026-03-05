import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { get, run } from "../../db/sqlite";
import { ALLOWED_VISIT_COMPANIES, CreateEventBody, normalizeLabels, parseUserId } from "./shared";

export function registerCreateEventRoute(fastify: FastifyInstance) {
  fastify.post(
    "/events",
    async (request: FastifyRequest<{ Body: CreateEventBody }>, reply: FastifyReply) => {
      const body = request.body ?? {};
      const userId = parseUserId(typeof body.userId === "number" ? String(body.userId) : body.userId);
      if (!userId) {
        return reply.status(400).send({ error: "INVALID_USER", message: "A valid userId is required." });
      }

      const name = (body.name ?? "").trim();
      if (!name) {
        return reply.status(400).send({ error: "INVALID_NAME", message: "Name is required." });
      }

      const lat = Number(body.lat);
      const lng = Number(body.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return reply.status(400).send({ error: "INVALID_COORDINATES", message: "Valid coordinates are required." });
      }

      const startDate = (body.startDate ?? body.date ?? "").trim();
      const endDate = (body.endDate ?? "").trim();
      if (!startDate) {
        return reply.status(400).send({ error: "INVALID_DATE", message: "Date or date range is required." });
      }

      const description = (body.description ?? "").trim();
      const normalizedRating =
        body.rating === undefined || body.rating === null || body.rating === "" ? null : Number(body.rating);

      if (
        normalizedRating !== null &&
        (!Number.isInteger(normalizedRating) || normalizedRating < 1 || normalizedRating > 10)
      ) {
        return reply.status(400).send({ error: "INVALID_RATING", message: "Rating must be between 1 and 10." });
      }

      const labels = normalizeLabels(body.labels);
      const visitCompany = (body.visitCompany ?? "").trim();
      if (visitCompany && !ALLOWED_VISIT_COMPANIES.has(visitCompany)) {
        return reply.status(400).send({ error: "INVALID_VISIT_COMPANY", message: "Invalid visit company value." });
      }

      try {
        const insertResult = (await run(
          `INSERT INTO events (user_id, title, start_date, end_date, description, rating, labels, visit_company, lat, lng)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            userId,
            name,
            startDate,
            endDate || null,
            description,
            normalizedRating,
            JSON.stringify(labels),
            visitCompany,
            lat,
            lng,
          ],
        )) as { lastID?: number };

        const eventId = insertResult.lastID;
        if (!eventId) {
          return reply.status(500).send({ error: "SERVER_ERROR", message: "Failed to create event." });
        }

        const event = await get(
          `SELECT id, user_id, title, start_date, end_date, description, rating, labels, visit_company, lat, lng, created_at
           FROM events
           WHERE id = ?`,
          [eventId],
        );

        return reply.status(201).send({
          event: {
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
            photos: [],
          },
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ error: "SERVER_ERROR", message: "Internal server error" });
      }
    },
  );
}
