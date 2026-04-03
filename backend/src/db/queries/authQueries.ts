import { get } from "../sqlite";

export type AuthUserRow = {
  id: number;
  email: string;
  password_hash: string;
};

export type AuthUserLookupRow = {
  id: number;
  email: string;
};

export async function getUserByEmail(email: string): Promise<AuthUserRow | null> {
  return (await get("SELECT id, email, password_hash FROM users WHERE email = ?", [email])) as AuthUserRow | null;
}

export async function hasUserByEmail(email: string): Promise<boolean> {
  const row = (await get("SELECT id FROM users WHERE email = ?", [email])) as { id: number } | null;
  return Boolean(row);
}

export async function getUserLookupByEmail(email: string): Promise<AuthUserLookupRow | null> {
  return (await get("SELECT id, email FROM users WHERE email = ?", [email])) as AuthUserLookupRow | null;
}

export async function getUserById(userId: number): Promise<AuthUserLookupRow | null> {
  return (await get("SELECT id, email FROM users WHERE id = ?", [userId])) as AuthUserLookupRow | null;
}
