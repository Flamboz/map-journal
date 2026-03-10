export const registerSchema = {
  body: {
    type: "object",
    additionalProperties: false,
    required: ["email", "password"],
    properties: {
      email: { type: "string", minLength: 1 },
      password: { type: "string", minLength: 1 },
    },
  },
} as const;

export const loginSchema = {
  body: {
    type: "object",
    additionalProperties: false,
    required: ["email", "password"],
    properties: {
      email: { type: "string", minLength: 1 },
      password: { type: "string", minLength: 1 },
    },
  },
} as const;
