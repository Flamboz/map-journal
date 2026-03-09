import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { all, get } from "../../db/sqlite";
import {
  EventParams,
  EventPhotoRow,
  EventRow,
  groupPhotosByEvent,
  normalizeEventRows,
  parseEventId,
  parseUserId,
  UserQuerystring,
} from "./shared";

const SAME_PIN_DISTANCE_METERS = 20;
const EARTH_RADIUS_METERS = 6_371_000;

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function getDistanceMeters(pointA: { lat: number; lng: number }, pointB: { lat: number; lng: number }): number {
  const latitudeDelta = toRadians(pointB.lat - pointA.lat);
  const longitudeDelta = toRadians(pointB.lng - pointA.lng);
  const latA = toRadians(pointA.lat);
  const latB = toRadians(pointB.lat);

  const a =
    Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
    Math.cos(latA) * Math.cos(latB) * Math.sin(longitudeDelta / 2) * Math.sin(longitudeDelta / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
}

export function registerGetEventByIdRoute(fastify: FastifyInstance) {
  fastify.get(
    "/events/:eventId",
    async (
      request: FastifyRequest<{ Params: EventParams; Querystring: UserQuerystring }>,
      reply: FastifyReply,
    ) => {
      const userId = parseUserId(request.query.userId);
      if (!userId) {
        return reply.status(400).send({ error: "INVALID_USER", message: "A valid userId is required." });
      }

      const eventId = parseEventId(request.params.eventId);
      if (!eventId) {
        return reply.status(400).send({ error: "INVALID_EVENT", message: "A valid eventId is required." });
      }

      try {
        const event = (await get(
          `SELECT id, user_id, title, start_date, end_date, description, rating, labels, visit_company, lat, lng, created_at
           FROM events
           WHERE id = ? AND user_id = ?`,
          [eventId, userId],
        )) as EventRow | null;

        if (!event) {
          return reply.status(404).send({ error: "EVENT_NOT_FOUND", message: "Event not found." });
        }

        const photos = (await all(
          `SELECT id, event_id, file_path, sort_order, created_at
           FROM event_photos
           WHERE event_id = ?
           ORDER BY sort_order ASC, created_at ASC, id ASC`,
          [eventId],
        )) as EventPhotoRow[];

        const latitudeDelta = SAME_PIN_DISTANCE_METERS / 111_320;
        const latitudeRadians = toRadians(event.lat);
        const cosineLatitude = Math.abs(Math.cos(latitudeRadians));
        const safeCosineLatitude = cosineLatitude < 1e-6 ? 1e-6 : cosineLatitude;
        const longitudeDelta = SAME_PIN_DISTANCE_METERS / (111_320 * safeCosineLatitude);

        const samePinEventCandidates = (await all(
          `SELECT id, lat, lng
           FROM events
           WHERE user_id = ?
             AND lat BETWEEN ? AND ?
             AND lng BETWEEN ? AND ?
           ORDER BY created_at DESC, id DESC`,
          [
            userId,
            event.lat - latitudeDelta,
            event.lat + latitudeDelta,
            event.lng - longitudeDelta,
            event.lng + longitudeDelta,
          ],
        )) as Array<{ id: string; lat: number; lng: number }>;

        const normalizedEvent = normalizeEventRows([event], groupPhotosByEvent(photos))[0];

        const samePinEventIds = samePinEventCandidates
          .filter((candidate) =>
            getDistanceMeters({ lat: event.lat, lng: event.lng }, { lat: candidate.lat, lng: candidate.lng }) <=
            SAME_PIN_DISTANCE_METERS,
          )
          .map((samePinEvent) => samePinEvent.id);

        return reply.status(200).send({
          event: {
            ...normalizedEvent,
            samePinEventIds,
          },
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ error: "SERVER_ERROR", message: "Internal server error" });
      }
    },
  );
}
