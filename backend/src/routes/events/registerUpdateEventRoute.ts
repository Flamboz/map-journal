import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { all, get, run } from "../../db/sqlite";
import {
  ALLOWED_VISIT_COMPANIES,
  EventParams,
  EventPhotoRow,
  EventRow,
  groupPhotosByEvent,
  normalizeEventRows,
  normalizeLabels,
  parseEventId,
  parseUserId,
  UpdateEventBody,
} from "./shared";

function parseStoredLabels(rawLabels?: string | null): string[] {
  if (!rawLabels) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawLabels);
    return Array.isArray(parsed) ? parsed.filter((label): label is string => typeof label === "string") : [];
  } catch {
    return [];
  }
}

export function registerUpdateEventRoute(fastify: FastifyInstance) {
  fastify.patch(
    "/events/:eventId",
    async (
      request: FastifyRequest<{ Params: EventParams; Body: UpdateEventBody }>,
      reply: FastifyReply,
    ) => {
      const body = request.body ?? {};
      const userId = parseUserId(typeof body.userId === "number" ? String(body.userId) : body.userId);
      if (!userId) {
        return reply.status(400).send({ error: "INVALID_USER", message: "A valid userId is required." });
      }

      const eventId = parseEventId(request.params.eventId);
      if (!eventId) {
        return reply.status(400).send({ error: "INVALID_EVENT", message: "A valid eventId is required." });
      }

      try {
        const existingEvent = (await get(
          `SELECT id, user_id, title, start_date, end_date, description, rating, labels, visit_company, lat, lng, created_at
           FROM events
           WHERE id = ?`,
          [eventId],
        )) as EventRow | null;

        if (!existingEvent) {
          return reply.status(404).send({ error: "EVENT_NOT_FOUND", message: "Event not found." });
        }

        if (Number(existingEvent.user_id) !== userId) {
          return reply.status(403).send({ error: "FORBIDDEN", message: "Cannot edit this event." });
        }

        const nextName = body.name === undefined ? existingEvent.title : String(body.name).trim();
        if (!nextName) {
          return reply.status(400).send({ error: "INVALID_NAME", message: "Name is required." });
        }

        const startDateInput = body.startDate ?? body.date;
        const nextStartDate =
          startDateInput === undefined ? String(existingEvent.start_date ?? "").trim() : String(startDateInput).trim();
        if (!nextStartDate) {
          return reply.status(400).send({ error: "INVALID_DATE", message: "Date or date range is required." });
        }

        const nextEndDate =
          body.endDate === undefined
            ? String(existingEvent.end_date ?? "").trim() || null
            : String(body.endDate).trim() || null;

        if (nextEndDate && nextEndDate < nextStartDate) {
          return reply.status(400).send({ error: "INVALID_DATE_RANGE", message: "End date cannot be before start date." });
        }

        const nextDescription =
          body.description === undefined ? String(existingEvent.description ?? "") : String(body.description).trim();

        const normalizedRating =
          body.rating === undefined
            ? existingEvent.rating ?? null
            : body.rating === null || body.rating === ""
              ? null
              : Number(body.rating);

        if (
          normalizedRating !== null &&
          (!Number.isInteger(normalizedRating) || normalizedRating < 1 || normalizedRating > 10)
        ) {
          return reply.status(400).send({ error: "INVALID_RATING", message: "Rating must be between 1 and 10." });
        }

        const nextLabels = body.labels === undefined ? parseStoredLabels(existingEvent.labels) : normalizeLabels(body.labels);

        const nextVisitCompany =
          body.visitCompany === undefined ? String(existingEvent.visit_company ?? "") : String(body.visitCompany).trim();
        if (nextVisitCompany && !ALLOWED_VISIT_COMPANIES.has(nextVisitCompany)) {
          return reply.status(400).send({ error: "INVALID_VISIT_COMPANY", message: "Invalid visit company value." });
        }

        await run(
          `UPDATE events
           SET title = ?, start_date = ?, end_date = ?, description = ?, rating = ?, labels = ?, visit_company = ?
           WHERE id = ?`,
          [
            nextName,
            nextStartDate,
            nextEndDate,
            nextDescription,
            normalizedRating,
            JSON.stringify(nextLabels),
            nextVisitCompany,
            eventId,
          ],
        );

        const updatedEvent = (await get(
          `SELECT id, user_id, title, start_date, end_date, description, rating, labels, visit_company, lat, lng, created_at
           FROM events
           WHERE id = ?`,
          [eventId],
        )) as EventRow | null;

        if (!updatedEvent) {
          return reply.status(404).send({ error: "EVENT_NOT_FOUND", message: "Event not found." });
        }

        const photos = (await all(
          `SELECT id, event_id, file_path, sort_order, created_at
           FROM event_photos
           WHERE event_id = ?
           ORDER BY sort_order ASC, created_at ASC, id ASC`,
          [eventId],
        )) as EventPhotoRow[];

        const normalizedEvent = normalizeEventRows([updatedEvent], groupPhotosByEvent(photos))[0];

        return reply.status(200).send({ event: normalizedEvent });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ error: "SERVER_ERROR", message: "Internal server error" });
      }
    },
  );
}