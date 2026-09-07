import bcrypt from "bcryptjs";

export async function verifyPassword(password: string): Promise<boolean> {
  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (!hash) return false;
  return bcrypt.compare(password, hash);
}

export { createSessionToken, verifySessionToken, SESSION_COOKIE } from "./session";
