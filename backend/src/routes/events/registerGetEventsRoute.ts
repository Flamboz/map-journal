import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { all } from "../../db/sqlite";
import {
  ALLOWED_LABEL_VALUES,
  ALLOWED_VISIT_COMPANIES,
  EventPhotoRow,
  EventRow,
  groupPhotosByEvent,
  normalizeEventRows,
  parseUserId,
  UserQuerystring,
} from "./shared";

function normalizeQueryLabels(rawLabels: string | string[] | undefined): string[] {
  if (!rawLabels) {
    return [];
  }

  const allowedLabels = new Set(ALLOWED_LABEL_VALUES);
  const labels = (Array.isArray(rawLabels) ? rawLabels : rawLabels.split(","))
    .map((label) => label.trim())
    .filter((label) => allowedLabels.has(label));

  return Array.from(new Set(labels));
}

export function registerGetEventsRoute(fastify: FastifyInstance) {
  fastify.get(
    "/events",
    async (request: FastifyRequest<{ Querystring: UserQuerystring }>, reply: FastifyReply) => {
      const userId = parseUserId(request.query.userId);
      if (!userId) {
        return reply.status(400).send({ error: "INVALID_USER", message: "A valid userId is required." });
      }

      try {
        const whereClauses: string[] = ["user_id = ?"];
        const params: Array<number | string> = [userId];
        const trimmedSearch = request.query.search?.trim();

        if (trimmedSearch) {
          whereClauses.push("(instr(title, ?) > 0 OR instr(COALESCE(description, ''), ?) > 0)");
          params.push(trimmedSearch, trimmedSearch);
        }

        const labels = normalizeQueryLabels(request.query.labels);
        if (labels.length > 0) {
          const labelWhere = labels.map(() => "labels LIKE ?").join(" OR ");
          whereClauses.push(`(${labelWhere})`);

          for (const label of labels) {
            params.push(`%\"${label}\"%`);
          }
        }

        const visitCompany = request.query.visitCompany?.trim();
        if (visitCompany && ALLOWED_VISIT_COMPANIES.has(visitCompany)) {
          whereClauses.push("visit_company = ?");
          params.push(visitCompany);
        }

        const dateFrom = request.query.dateFrom?.trim();
        const dateTo = request.query.dateTo?.trim();
        if (dateFrom || dateTo) {
          whereClauses.push("start_date IS NOT NULL");

          if (dateTo) {
            whereClauses.push("start_date <= ?");
            params.push(dateTo);
          }

          if (dateFrom) {
            whereClauses.push("COALESCE(end_date, start_date) >= ?");
            params.push(dateFrom);
          }
        }

        const events = (await all(
          `SELECT id, user_id, title, start_date, end_date, description, rating, labels, visit_company, lat, lng, created_at
           FROM events
           WHERE ${whereClauses.join(" AND ")}
           ORDER BY created_at DESC, id DESC`,
          params,
        )) as EventRow[];

        const eventIds = events.map((event) => event.id);
        const photos =
          eventIds.length > 0
            ? ((await all(
                `SELECT id, event_id, file_path, created_at
                 FROM event_photos
                 WHERE event_id IN (${eventIds.map(() => "?").join(",")})
                 ORDER BY sort_order ASC, created_at ASC, id ASC`,
                eventIds,
              )) as EventPhotoRow[])
            : [];

        const normalizedEvents = normalizeEventRows(events, groupPhotosByEvent(photos));

        return reply.status(200).send({ events: normalizedEvents });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ error: "SERVER_ERROR", message: "Internal server error" });
      }
    },
  );
}
