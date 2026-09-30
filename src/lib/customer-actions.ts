"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { customerNotes } from "@/db/schema";
import { getCurrentAdmin } from "./admin-users";

export async function saveCustomerNotes(formData: FormData): Promise<void> {
  const admin = await getCurrentAdmin();
  if (!admin || !["administrator", "sales_manager"].includes(admin.role)) return;

  const digits = String(formData.get("digits") ?? "").replace(/\D/g, "");
  const notes = String(formData.get("notes") ?? "").slice(0, 5000);
  if (!digits) return;

  await db
    .insert(customerNotes)
    .values({ phoneDigits: digits, notes, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: customerNotes.phoneDigits,
      set: { notes, updatedAt: new Date() },
    });
  revalidatePath(`/admin/customers/${digits}`);
}
