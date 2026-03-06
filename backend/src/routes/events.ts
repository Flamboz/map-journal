import { FastifyInstance } from "fastify";
import { registerCreateEventRoute } from "./events/registerCreateEventRoute";
import { registerDeleteEventPhotoRoute } from "./events/registerDeleteEventPhotoRoute";
import { registerGetEventByIdRoute } from "./events/registerGetEventByIdRoute";
import { registerGetEventsRoute } from "./events/registerGetEventsRoute";
import { registerMapPositionRoute } from "./events/registerMapPositionRoute";
import { registerMetadataRoutes } from "./events/registerMetadataRoutes";
import { registerSetPreviewPhotoRoute } from "./events/registerSetPreviewPhotoRoute";
import { registerUpdateEventRoute } from "./events/registerUpdateEventRoute";
import { registerUploadEventPhotosRoute } from "./events/registerUploadEventPhotosRoute";

export default async function eventsRoutes(fastify: FastifyInstance) {
  registerMetadataRoutes(fastify);
  registerGetEventsRoute(fastify);
  registerGetEventByIdRoute(fastify);
  registerCreateEventRoute(fastify);
  registerUpdateEventRoute(fastify);
  registerUploadEventPhotosRoute(fastify);
  registerDeleteEventPhotoRoute(fastify);
  registerSetPreviewPhotoRoute(fastify);
  registerMapPositionRoute(fastify);
}
