const COOKIE_NAME = "mebelflow_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function fromHex(hex: string): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(new ArrayBuffer(hex.length / 2));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

async function importSigningKey() {
  const secret = process.env.SESSION_SECRET!;
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

async function sign(value: string): Promise<string> {
  const key = await importSigningKey();
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(value)
  );
  return toHex(signature);
}

export interface AdminSession {
  userId: string;
  role: string;
}

export async function createSessionToken(
  userId: string,
  role: string
): Promise<string> {
  const issuedAt = Date.now().toString();
  const payload = `${userId}.${role}.${issuedAt}`;
  const signature = await sign(payload);
  return `${payload}.${signature}`;
}

export async function verifySessionToken(
  token: string | undefined
): Promise<AdminSession | null> {
  if (!token) return null;
  const [userId, role, issuedAt, signature] = token.split(".");
  if (!userId || !role || !issuedAt || !signature) return null;

  try {
    const key = await importSigningKey();
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      fromHex(signature),
      new TextEncoder().encode(`${userId}.${role}.${issuedAt}`)
    );
    if (!valid) return null;
  } catch {
    return null;
  }

  const age = Date.now() - Number(issuedAt);
  if (age < 0 || age > MAX_AGE_SECONDS * 1000) return null;

  return { userId, role };
}

export const SESSION_COOKIE = {
  name: COOKIE_NAME,
  maxAge: MAX_AGE_SECONDS,
};
