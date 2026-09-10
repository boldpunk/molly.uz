import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { adminUsers } from "@/db/schema";
import { SESSION_COOKIE, verifySessionToken } from "./session";

export interface CurrentAdmin {
  id: string;
  name: string;
  email: string;
  role: string;
}

export async function getCurrentAdmin(): Promise<CurrentAdmin | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE.name)?.value;
  const session = await verifySessionToken(token);
  if (!session) return null;

  const rows = await db
    .select({
      id: adminUsers.id,
      name: adminUsers.name,
      email: adminUsers.email,
      role: adminUsers.role,
    })
    .from(adminUsers)
    .where(eq(adminUsers.id, session.userId))
    .limit(1);

  return rows[0] ?? null;
}

export { ADMIN_ROLE_LABELS } from "./admin-role-labels";
