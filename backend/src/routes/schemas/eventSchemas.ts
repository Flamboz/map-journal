export const createEventSchema = {
  body: {
    type: "object",
    additionalProperties: false,
    required: ["userId", "name", "lat", "lng"],
    properties: {
      userId: { anyOf: [{ type: "string" }, { type: "number" }] },
      name: { type: "string" },
      date: { type: "string" },
      startDate: { type: "string" },
      endDate: { type: "string" },
      description: { type: "string" },
      rating: { anyOf: [{ type: "string" }, { type: "number" }, { type: "null" }] },
      labels: {
        type: "array",
        items: { type: "string" },
      },
      visitCompany: { type: "string" },
      lat: { type: "number" },
      lng: { type: "number" },
      visibility: { type: "string", enum: ["private", "share_with"] },
      sharedWithEmails: {
        type: "array",
        items: { type: "string" },
      },
    },
  },
} as const;

export const updateEventSchema = {
  body: {
    type: "object",
    additionalProperties: false,
    properties: {
      userId: { anyOf: [{ type: "string" }, { type: "number" }] },
      name: { type: "string" },
      date: { type: "string" },
      startDate: { type: "string" },
      endDate: { type: "string" },
      description: { type: "string" },
      rating: { anyOf: [{ type: "string" }, { type: "number" }, { type: "null" }] },
      labels: {
        type: "array",
        items: { type: "string" },
      },
      visitCompany: { type: "string" },
      visibility: { type: "string", enum: ["private", "share_with"] },
      sharedWithEmails: {
        type: "array",
        items: { type: "string" },
      },
    },
  },
} as const;
