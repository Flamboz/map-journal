import { getUserById, getUserLookupByEmail } from "../db/queries/authQueries";
import { all, run } from "../db/sqlite";
import { failure, ServiceResult, success } from "./serviceResult";
import { isValidEmail, normalizeEmail } from "../utils/validators";

export const PRIVATE_VISIBILITY = "private";
export const SHARE_WITH_VISIBILITY = "share_with";

export type EventVisibility = typeof PRIVATE_VISIBILITY | typeof SHARE_WITH_VISIBILITY;

type ShareUserRow = {
  id: number;
  email: string;
};

type EventShareRow = {
  event_id: string;
  email: string;
};

type ResolvedShareRecipients = {
  visibility: EventVisibility;
  recipientUserIds: number[];
  recipientEmails: string[];
};

export function normalizeEventVisibility(value: unknown): EventVisibility {
  return value === SHARE_WITH_VISIBILITY ? SHARE_WITH_VISIBILITY : PRIVATE_VISIBILITY;
}

function normalizeSharedEmails(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((entry) => normalizeEmail(entry)).filter(Boolean);
}

export async function resolveShareRecipients(input: {
  ownerUserId: number;
  visibility?: unknown;
  sharedWithEmails?: unknown;
}): Promise<ServiceResult<ResolvedShareRecipients>> {
  const visibility = normalizeEventVisibility(input.visibility);
  if (visibility === PRIVATE_VISIBILITY) {
    return success({
      visibility,
      recipientUserIds: [],
      recipientEmails: [],
    });
  }

  const owner = await getUserById(input.ownerUserId);
  if (!owner) {
    return failure(400, "INVALID_USER", "A valid userId is required.");
  }

  const normalizedEmails = normalizeSharedEmails(input.sharedWithEmails);
  if (normalizedEmails.length === 0) {
    return failure(400, "MISSING_SHARED_RECIPIENTS", "Add at least one existing email to share this event.");
  }

  if (normalizedEmails.some((email) => !isValidEmail(email))) {
    return failure(400, "INVALID_SHARED_EMAIL", "One or more shared email addresses are invalid.");
  }

  const uniqueEmails = Array.from(new Set(normalizedEmails));
  if (uniqueEmails.length !== normalizedEmails.length) {
    return failure(400, "DUPLICATE_SHARED_EMAIL", "Each shared email can only be added once.");
  }

  if (uniqueEmails.includes(owner.email)) {
    return failure(400, "SELF_SHARE_NOT_ALLOWED", "You cannot share an event with your own email.");
  }

  const resolvedUsers = (await all(
    `SELECT id, email
     FROM users
     WHERE email IN (${uniqueEmails.map(() => "?").join(",")})`,
    uniqueEmails,
  )) as ShareUserRow[];

  if (resolvedUsers.length !== uniqueEmails.length) {
    return failure(400, "SHARED_USER_NOT_FOUND", "Every shared email must belong to an existing user.");
  }

  const resolvedUsersByEmail = new Map(resolvedUsers.map((user) => [user.email, user]));
  const orderedUsers = uniqueEmails
    .map((email) => resolvedUsersByEmail.get(email))
    .filter((user): user is ShareUserRow => Boolean(user));

  return success({
    visibility,
    recipientUserIds: orderedUsers.map((user) => user.id),
    recipientEmails: orderedUsers.map((user) => user.email),
  });
}

export async function syncEventShares(eventId: string, recipientUserIds: number[]): Promise<void> {
  await run("DELETE FROM event_shares WHERE event_id = ?", [eventId]);

  for (const recipientUserId of recipientUserIds) {
    await run(
      `INSERT INTO event_shares (event_id, shared_with_user_id)
       VALUES (?, ?)`,
      [eventId, recipientUserId],
    );
  }
}

export async function getSharedEmailsByEventIds(eventIds: string[]): Promise<Map<string, string[]>> {
  if (eventIds.length === 0) {
    return new Map();
  }

  const rows = (await all(
    `SELECT event_shares.event_id, users.email
     FROM event_shares
     INNER JOIN users ON users.id = event_shares.shared_with_user_id
     WHERE event_shares.event_id IN (${eventIds.map(() => "?").join(",")})
     ORDER BY users.email ASC`,
    eventIds,
  )) as EventShareRow[];

  const sharedEmailsByEvent = new Map<string, string[]>();
  for (const row of rows) {
    const currentEmails = sharedEmailsByEvent.get(row.event_id) ?? [];
    currentEmails.push(row.email);
    sharedEmailsByEvent.set(row.event_id, currentEmails);
  }

  return sharedEmailsByEvent;
}

export async function findShareableUserByEmail(email: unknown): Promise<{ exists: boolean; email: string | null }> {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
    return { exists: false, email: null };
  }

  const user = await getUserLookupByEmail(normalizedEmail);
  return {
    exists: Boolean(user),
    email: user?.email ?? null,
  };
}
