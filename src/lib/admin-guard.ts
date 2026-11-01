import { getCurrentAdmin, type CurrentAdmin } from "./admin-users";

// Server actions are public POST endpoints: anyone who has an action's ID
// can call it without going through the admin UI, and the route checks in
// proxy.ts are not a substitute. Every admin action starts with one of these.
export const ROLES = {
  catalog: ["administrator", "catalog_manager"],
  sales: ["administrator", "sales_manager"],
  content: ["administrator", "content_editor"],
  admin: ["administrator"],
} as const;

export async function requireRole(roles: readonly string[]): Promise<CurrentAdmin> {
  const admin = await getCurrentAdmin();
  if (!admin || !roles.includes(admin.role)) {
    throw new Error("Недостаточно прав для этого действия");
  }
  return admin;
}
