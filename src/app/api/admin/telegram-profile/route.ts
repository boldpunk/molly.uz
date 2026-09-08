import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/admin-users";
import { setBotProfile } from "@/lib/telegram";

export async function POST() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  await setBotProfile();
  return NextResponse.json({ ok: true });
}
