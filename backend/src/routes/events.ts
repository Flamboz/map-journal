import { FastifyInstance } from "fastify";
import { registerCreateEventRoute } from "./events/registerCreateEventRoute";
import { registerGetEventByIdRoute } from "./events/registerGetEventByIdRoute";
import { registerGetEventsRoute } from "./events/registerGetEventsRoute";
import { registerMapPositionRoute } from "./events/registerMapPositionRoute";
import { registerMetadataRoutes } from "./events/registerMetadataRoutes";
import { registerUploadEventPhotosRoute } from "./events/registerUploadEventPhotosRoute";

export default async function eventsRoutes(fastify: FastifyInstance) {
  registerMetadataRoutes(fastify);
  registerGetEventsRoute(fastify);
  registerGetEventByIdRoute(fastify);
  registerCreateEventRoute(fastify);
  registerUploadEventPhotosRoute(fastify);
  registerMapPositionRoute(fastify);
}
