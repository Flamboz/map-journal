import { FastifyInstance } from "fastify";
import { registerCreateEventRoute } from "./events/registerCreateEventRoute";
import { registerDeleteEventRoute } from "./events/registerDeleteEventRoute";
import { registerDeleteEventPhotoRoute } from "./events/registerDeleteEventPhotoRoute";
import { registerGetEventByIdRoute } from "./events/registerGetEventByIdRoute";
import { registerGetEventsRoute } from "./events/registerGetEventsRoute";
import { registerMapPositionRoute } from "./events/registerMapPositionRoute";
import { registerMetadataRoutes } from "./events/registerMetadataRoutes";
import { registerPlaceSearchRoute } from "./events/registerPlaceSearchRoute";
import { registerSetPreviewPhotoRoute } from "./events/registerSetPreviewPhotoRoute";
import { registerLookupShareUserRoute } from "./events/registerLookupShareUserRoute";
import { registerUpdateEventRoute } from "./events/registerUpdateEventRoute";
import { registerUploadEventPhotosRoute } from "./events/registerUploadEventPhotosRoute";

export default async function eventsRoutes(fastify: FastifyInstance) {
  registerMetadataRoutes(fastify);
  registerLookupShareUserRoute(fastify);
  registerGetEventsRoute(fastify);
  registerGetEventByIdRoute(fastify);
  registerCreateEventRoute(fastify);
  registerUpdateEventRoute(fastify);
  registerDeleteEventRoute(fastify);
  registerUploadEventPhotosRoute(fastify);
  registerDeleteEventPhotoRoute(fastify);
  registerSetPreviewPhotoRoute(fastify);
  registerMapPositionRoute(fastify);
  registerPlaceSearchRoute(fastify);
}
