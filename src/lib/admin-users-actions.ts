"use server";

import { eq, ne, and, count } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { adminUsers } from "@/db/schema";
import { getCurrentAdmin } from "./admin-users";

type AdminRole =
  | "administrator"
  | "content_editor"
  | "catalog_manager"
  | "sales_manager";

const VALID_ROLES: AdminRole[] = [
  "administrator",
  "content_editor",
  "catalog_manager",
  "sales_manager",
];

function normalizeRole(raw: FormDataEntryValue | null): AdminRole {
  const value = String(raw ?? "");
  return (VALID_ROLES as string[]).includes(value)
    ? (value as AdminRole)
    : "content_editor";
}

async function countAdministrators(excludeId?: string) {
  const rows = await db
    .select({ total: count() })
    .from(adminUsers)
    .where(
      excludeId
        ? and(eq(adminUsers.role, "administrator"), ne(adminUsers.id, excludeId))
        : eq(adminUsers.role, "administrator")
    );
  return rows[0]?.total ?? 0;
}

export async function createAdminUser(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = normalizeRole(formData.get("role"));

  if (!name || !email || password.length < 8) {
    redirect("/admin/users/new?error=invalid");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    await db.insert(adminUsers).values({ name, email, passwordHash, role });
  } catch {
    redirect("/admin/users/new?error=email_taken");
  }

  revalidatePath("/admin/users");
  redirect("/admin/users");
}

export async function updateAdminUser(id: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = normalizeRole(formData.get("role"));

  if (!name || !email) {
    redirect(`/admin/users/${id}?error=invalid`);
  }

  if (role !== "administrator") {
    const [existing] = await db
      .select({ role: adminUsers.role })
      .from(adminUsers)
      .where(eq(adminUsers.id, id))
      .limit(1);
    if (existing?.role === "administrator") {
      const remaining = await countAdministrators(id);
      if (remaining === 0) {
        redirect(`/admin/users/${id}?error=last_admin`);
      }
    }
  }

  const values: {
    name: string;
    email: string;
    role: AdminRole;
    passwordHash?: string;
  } = { name, email, role };

  if (password) {
    if (password.length < 8) {
      redirect(`/admin/users/${id}?error=invalid`);
    }
    values.passwordHash = await bcrypt.hash(password, 10);
  }

  try {
    await db.update(adminUsers).set(values).where(eq(adminUsers.id, id));
  } catch {
    redirect(`/admin/users/${id}?error=email_taken`);
  }

  revalidatePath("/admin/users");
  redirect("/admin/users");
}

export async function deleteAdminUser(id: string) {
  const current = await getCurrentAdmin();
  if (current?.id === id) {
    redirect("/admin/users?error=self_delete");
  }

  const [existing] = await db
    .select({ role: adminUsers.role })
    .from(adminUsers)
    .where(eq(adminUsers.id, id))
    .limit(1);

  if (existing?.role === "administrator") {
    const remaining = await countAdministrators(id);
    if (remaining === 0) {
      redirect("/admin/users?error=last_admin");
    }
  }

  await db.delete(adminUsers).where(eq(adminUsers.id, id));
  revalidatePath("/admin/users");
  redirect("/admin/users");
}
