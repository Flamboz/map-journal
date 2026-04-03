import bcrypt from "bcryptjs";

export async function hashPassword(password: string) {
  const salt = 10;
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(hash: string, password: string) {
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}
