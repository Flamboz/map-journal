import { createHmac, timingSafeEqual } from "crypto";

type AuthTokenPayload = {
  sub: number;
  email: string;
  iat: number;
  exp: number;
};

export type AuthenticatedUser = {
  id: number;
  email: string;
};

const DEFAULT_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30;

function getAuthTokenSecret(): string {
  const secret = process.env.AUTH_TOKEN_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_TOKEN_SECRET or NEXTAUTH_SECRET must be set.");
  }

  return secret;
}

function getAuthTokenTtlSeconds(): number {
  const configuredTtl = Number(process.env.AUTH_TOKEN_TTL_SECONDS ?? DEFAULT_TOKEN_TTL_SECONDS);
  return Number.isFinite(configuredTtl) && configuredTtl > 0 ? Math.floor(configuredTtl) : DEFAULT_TOKEN_TTL_SECONDS;
}

function signTokenValue(value: string): string {
  return createHmac("sha256", getAuthTokenSecret()).update(value).digest("base64url");
}

function encodePayload(payload: AuthTokenPayload): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodePayload(value: string): AuthTokenPayload | null {
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as Partial<AuthTokenPayload>;
    if (
      typeof parsed.sub !== "number" ||
      typeof parsed.email !== "string" ||
      typeof parsed.iat !== "number" ||
      typeof parsed.exp !== "number"
    ) {
      return null;
    }

    return {
      sub: parsed.sub,
      email: parsed.email,
      iat: parsed.iat,
      exp: parsed.exp,
    };
  } catch {
    return null;
  }
}

function hasValidSignature(payloadValue: string, signature: string): boolean {
  const expectedSignature = signTokenValue(payloadValue);
  const providedBuffer = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");

  if (providedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(providedBuffer, expectedBuffer);
}

export function assertAuthTokenSecretConfigured() {
  void getAuthTokenSecret();
}

export function issueAuthToken(user: AuthenticatedUser): string {
  const issuedAt = Math.floor(Date.now() / 1000);
  const payloadValue = encodePayload({
    sub: user.id,
    email: user.email,
    iat: issuedAt,
    exp: issuedAt + getAuthTokenTtlSeconds(),
  });
  const signature = signTokenValue(payloadValue);

  return `${payloadValue}.${signature}`;
}

export function verifyAuthToken(token: string): AuthenticatedUser | null {
  const [payloadValue, signature] = token.split(".");
  if (!payloadValue || !signature || !hasValidSignature(payloadValue, signature)) {
    return null;
  }

  const payload = decodePayload(payloadValue);
  if (!payload || payload.exp <= Math.floor(Date.now() / 1000)) {
    return null;
  }

  return {
    id: payload.sub,
    email: payload.email,
  };
}
