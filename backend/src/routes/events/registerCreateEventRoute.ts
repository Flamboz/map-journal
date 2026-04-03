import type { Multipart, MultipartFile } from "@fastify/multipart";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { sendError, sendServerError } from "../../utils/httpErrors";
import { CreateEventBody } from "./shared";
import { createEventForUser, createEventWithPhotosForUser } from "../../services/eventService";
import { requireAuthenticatedUserId } from "../../auth/requestAuth";
import type { UploadPart } from "../../services/photoService";

const MULTIPART_PAYLOAD_FIELD = "payload";

type CreateEventRequestInput = {
  body: CreateEventBody;
  photoParts: AsyncIterable<UploadPart> | null;
};

function parseMultipartCreateEventBody(rawValue: unknown): CreateEventBody | null {
  if (typeof rawValue !== "string") {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }

    return parsed as CreateEventBody;
  } catch {
    return null;
  }
}

async function* iterateMultipartPhotoParts(
  firstFilePart: MultipartFile,
  remainingParts: AsyncIterable<Multipart>,
): AsyncIterable<UploadPart> {
  yield firstFilePart;

  for await (const part of remainingParts) {
    if (part.type === "file") {
      yield part;
    }
  }
}

async function getCreateEventRequestInput(
  request: FastifyRequest<{ Body: CreateEventBody }>,
  reply: FastifyReply,
): Promise<CreateEventRequestInput | null> {
  if (!request.isMultipart()) {
    return {
      body: request.body ?? {},
      photoParts: null,
    };
  }

  const parts = request.parts() as AsyncIterable<Multipart>;
  let body: CreateEventBody | null = null;
  let firstFilePart: MultipartFile | null = null;

  for await (const part of parts) {
    if (part.type === "field") {
      if (part.fieldname === MULTIPART_PAYLOAD_FIELD) {
        body = parseMultipartCreateEventBody(part.value);
        if (!body) {
          sendError(reply, 400, "INVALID_EVENT_PAYLOAD", "Multipart event payload must be valid JSON.");
          return null;
        }
      }
      continue;
    }

    firstFilePart = part;
    break;
  }

  if (!body) {
    sendError(reply, 400, "INVALID_EVENT_PAYLOAD", "Multipart event payload is required before photo files.");
    return null;
  }

  return {
    body,
    photoParts: firstFilePart ? iterateMultipartPhotoParts(firstFilePart, parts) : null,
  };
}

export function registerCreateEventRoute(fastify: FastifyInstance) {
  fastify.post(
    "/events",
    async (request: FastifyRequest<{ Body: CreateEventBody }>, reply: FastifyReply) => {
      const userId = requireAuthenticatedUserId(request, reply);
      if (!userId) {
        return;
      }

      const requestInput = await getCreateEventRequestInput(request, reply);
      if (!requestInput) {
        return;
      }

      try {
        const result = requestInput.photoParts
          ? await createEventWithPhotosForUser({ ...requestInput.body, userId }, requestInput.photoParts)
          : await createEventForUser({ ...requestInput.body, userId });
        if (!result.ok) {
          return sendError(reply, result.error.statusCode, result.error.error, result.error.message);
        }

        return reply.status(201).send({ event: result.value });
      } catch (error) {
        return sendServerError(request, reply, error);
      }
    },
  );
}
