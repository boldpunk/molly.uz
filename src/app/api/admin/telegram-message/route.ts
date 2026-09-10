import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/admin-users";
import { deleteTelegramMessage, getStaffChatId } from "@/lib/telegram";

export async function DELETE(request: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const messageId = new URL(request.url).searchParams.get("messageId");
  if (!messageId) {
    return NextResponse.json({ error: "messageId required" }, { status: 400 });
  }

  const chatId = getStaffChatId();
  if (!chatId) {
    return NextResponse.json({ error: "staff chat not configured" }, { status: 400 });
  }

  await deleteTelegramMessage(chatId, messageId);
  return NextResponse.json({ ok: true });
}
