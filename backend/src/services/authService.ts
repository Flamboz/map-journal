import { hashPassword, verifyPassword } from "../auth/hash";
import { hasUserByEmail, getUserByEmail } from "../db/queries/authQueries";
import { run } from "../db/sqlite";

export async function registerUser(email: string, password: string) {
  const exists = await hasUserByEmail(email);
  if (exists) {
    return null;
  }

  const passwordHash = await hashPassword(password);
  const insertResult = (await run("INSERT INTO users (email, password_hash) VALUES (?, ?)", [
    email,
    passwordHash,
  ])) as { lastID?: number };

  const userId = insertResult.lastID ?? null;
  await run("INSERT INTO profiles (user_id) VALUES (?)", [userId]);

  return {
    id: userId,
    email,
  };
}

export async function authenticateUser(email: string, password: string) {
  const user = await getUserByEmail(email);
  if (!user) {
    return null;
  }

  const matches = await verifyPassword(user.password_hash, password);
  if (!matches) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
  };
}
