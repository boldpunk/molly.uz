import { eq, and, desc } from "drizzle-orm";
import { db } from "@/db";
import { conversations, conversationMessages, employees, telegramPendingActions } from "@/db/schema";
import {
  sendTelegramMessage,
  getStaffChatId,
  isStaffNotifyConfigured,
  escapeHtml,
} from "./telegram";

export async function sendOpenConversationsList(chatId: number | string): Promise<void> {
  const open = await db
    .select()
    .from(conversations)
    .where(eq(conversations.status, "open"))
    .orderBy(desc(conversations.updatedAt))
    .limit(20);

  if (open.length === 0) {
    await sendTelegramMessage(chatId, "💬 Открытых диалогов нет.");
    return;
  }

  const lines = open.map((c) => {
    const minutesAgo = Math.round((Date.now() - c.updatedAt.getTime()) / 60000);
    const ago =
      minutesAgo < 60
        ? `${minutesAgo} мин назад`
        : `${Math.round(minutesAgo / 60)} ч назад`;
    return `• <b>${escapeHtml(c.customerName)}</b> — последнее сообщение ${ago}`;
  });
  await sendTelegramMessage(
    chatId,
    `💬 Открытые диалоги (${open.length}):\n\n${lines.join("\n")}\n\nОтветьте на сообщение клиента в чате, чтобы продолжить разговор.`
  );
}

const CLOSE_KEYBOARD = (conversationId: string) => ({
  inline_keyboard: [[{ text: "✅ Завершить диалог", callback_data: `conv:close:${conversationId}` }]],
});

export async function getOpenConversation(telegramId: string) {
  const [row] = await db
    .select()
    .from(conversations)
    .where(and(eq(conversations.customerTelegramId, telegramId), eq(conversations.status, "open")))
    .limit(1);
  return row ?? null;
}

export async function startConversation(
  chatId: number | string,
  customerName: string
): Promise<void> {
  const telegramId = String(chatId);
  const existing = await getOpenConversation(telegramId);
  if (existing) {
    await sendTelegramMessage(
      chatId,
      "У вас уже есть открытый диалог с менеджером. Напишите сообщение — я передам его.",
      { replyMarkup: CLOSE_KEYBOARD(existing.id) }
    );
    return;
  }

  const [created] = await db
    .insert(conversations)
    .values({ customerTelegramId: telegramId, customerName })
    .returning({ id: conversations.id });

  await sendTelegramMessage(
    chatId,
    "Опишите ваш вопрос следующим сообщением — я передам его менеджеру и пришлю ответ сюда же.",
    { replyMarkup: CLOSE_KEYBOARD(created.id) }
  );
}

export async function relayCustomerMessage(
  chatId: number | string,
  customerName: string,
  text: string
): Promise<boolean> {
  const telegramId = String(chatId);
  const conversation = await getOpenConversation(telegramId);
  if (!conversation) return false;

  await db.insert(conversationMessages).values({
    conversationId: conversation.id,
    direction: "from_customer",
    authorName: customerName,
    text,
  });
  await db
    .update(conversations)
    .set({ updatedAt: new Date() })
    .where(eq(conversations.id, conversation.id));

  if (!isStaffNotifyConfigured()) return true;

  const relayText = `💬 Сообщение от клиента\nОт: ${escapeHtml(customerName)}\n\n${escapeHtml(text)}\n\n<i>Ответьте на это сообщение, чтобы передать ответ клиенту.</i>`;
  const keyboard = CLOSE_KEYBOARD(conversation.id);

  const staffChatId = getStaffChatId();
  if (staffChatId) {
    const sent = await sendTelegramMessage(staffChatId, relayText, { replyMarkup: keyboard });
    if (sent) {
      await db
        .insert(telegramPendingActions)
        .values({
          key: `msg:${sent.message_id}`,
          kind: "conversation_reply",
          payload: conversation.id,
        })
        .onConflictDoUpdate({
          target: telegramPendingActions.key,
          set: { kind: "conversation_reply", payload: conversation.id },
        });
    }
  }

  const recipients = await db.select({ telegramId: employees.telegramId }).from(employees);
  await Promise.all(
    recipients
      .filter((r) => /^\d+$/.test(r.telegramId) && r.telegramId !== telegramId)
      .map(async (r) => {
        const sent = await sendTelegramMessage(r.telegramId, relayText, { replyMarkup: keyboard });
        // DMs get their own pending row too — a manager can reply from their
        // private chat with the bot just as well as from the group.
        if (sent) {
          await db
            .insert(telegramPendingActions)
            .values({
              key: `msg:${sent.message_id}`,
              kind: "conversation_reply",
              payload: conversation.id,
            })
            .onConflictDoUpdate({
              target: telegramPendingActions.key,
              set: { kind: "conversation_reply", payload: conversation.id },
            });
        }
      })
  );

  return true;
}

export async function resolveConversationReply(
  conversationId: string,
  actorName: string,
  text: string
): Promise<void> {
  const [conversation] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, conversationId))
    .limit(1);
  if (!conversation) return;

  await db.insert(conversationMessages).values({
    conversationId,
    direction: "from_staff",
    authorName: actorName,
    text,
  });
  await db
    .update(conversations)
    .set({ updatedAt: new Date() })
    .where(eq(conversations.id, conversationId));

  await sendTelegramMessage(
    conversation.customerTelegramId,
    `👔 <b>${escapeHtml(actorName)}</b>:\n${escapeHtml(text)}`,
    { replyMarkup: CLOSE_KEYBOARD(conversationId) }
  );
}

export async function closeConversation(
  conversationId: string,
  closingChatId: number | string,
  closedByLabel: string
): Promise<void> {
  const [conversation] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, conversationId))
    .limit(1);
  if (!conversation || conversation.status === "closed") return;

  await db
    .update(conversations)
    .set({ status: "closed", closedAt: new Date(), updatedAt: new Date() })
    .where(eq(conversations.id, conversationId));

  const side: "client" | "staff" =
    String(closingChatId) === conversation.customerTelegramId ? "client" : "staff";

  if (side === "client") {
    if (!isStaffNotifyConfigured()) return;
    const text = `✅ Диалог с клиентом «${escapeHtml(conversation.customerName)}» закрыт клиентом.`;
    const staffChatId = getStaffChatId();
    if (staffChatId) await sendTelegramMessage(staffChatId, text);
  } else {
    await sendTelegramMessage(
      conversation.customerTelegramId,
      `Диалог завершён менеджером (${escapeHtml(closedByLabel)}). Если появятся новые вопросы — напишите ещё раз.`
    );
  }
}
