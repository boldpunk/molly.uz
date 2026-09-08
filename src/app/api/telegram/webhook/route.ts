import { NextRequest, NextResponse } from "next/server";
import { desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { requests, customers } from "@/db/schema";
import {
  sendTelegramMessage,
  answerCallbackQuery,
  parseCallbackData,
  getStaffChatId,
  REQUEST_CONTACT_KEYBOARD,
} from "@/lib/telegram";
import {
  handleOrderAction,
  startAmountPrompt,
  resolveAmountPrompt,
  registerEmployeeName,
  setPendingRegistration,
  consumePendingRegistration,
  clearPendingRegistration,
} from "@/lib/order-bot";
import { REQUEST_STATUS_LABELS, RequestStatus } from "@/lib/types";

interface TelegramContact {
  phone_number: string;
}

interface TelegramFrom {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
}

interface TelegramMessage {
  message_id: number;
  chat: { id: number; type: string };
  from?: TelegramFrom;
  text?: string;
  contact?: TelegramContact;
  reply_to_message?: { message_id: number };
}

interface TelegramCallbackQuery {
  id: string;
  data?: string;
  from: TelegramFrom;
  message?: { chat: { id: number }; message_id: number };
}

interface TelegramUpdate {
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
}

export async function POST(request: NextRequest) {
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (expectedSecret) {
    const header = request.headers.get("x-telegram-bot-api-secret-token");
    if (header !== expectedSecret) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
  }

  let update: TelegramUpdate;
  try {
    update = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (update.callback_query) {
    await handleCallbackQuery(update.callback_query);
  } else if (update.message) {
    await handleMessage(update.message);
  }

  return NextResponse.json({ ok: true });
}

function displayName(from: TelegramFrom): string {
  const name = [from.first_name, from.last_name].filter(Boolean).join(" ").trim();
  return name || (from.username ? `@${from.username}` : `Пользователь ${from.id}`);
}

async function handleCallbackQuery(cq: TelegramCallbackQuery) {
  const staffChatId = getStaffChatId();
  const chatId = cq.message?.chat.id;
  if (!chatId || !staffChatId || String(chatId) !== String(staffChatId)) {
    await answerCallbackQuery(cq.id);
    return;
  }

  const parsed = cq.data ? parseCallbackData(cq.data) : null;
  if (!parsed) {
    await answerCallbackQuery(cq.id);
    return;
  }

  const actor = { telegramId: String(cq.from.id), name: displayName(cq.from) };
  const result = await handleOrderAction(parsed.requestId, parsed.action, actor);

  if (result.kind === "amount_prompt") {
    await answerCallbackQuery(cq.id, "Введите сумму сообщением ниже");
    await startAmountPrompt(parsed.requestId, result.promptKind, actor);
  } else if (result.kind === "updated") {
    await answerCallbackQuery(cq.id, "Статус обновлён");
  } else {
    await answerCallbackQuery(cq.id);
  }

  revalidatePath("/admin/requests");
  revalidatePath(`/admin/requests/${parsed.requestId}`);
  revalidatePath("/admin");
}

async function handleMessage(message: TelegramMessage) {
  const staffChatId = getStaffChatId();
  const chatId = message.chat.id;

  if (staffChatId && String(chatId) === String(staffChatId)) {
    if (message.reply_to_message && message.text && message.from) {
      const actor = {
        telegramId: String(message.from.id),
        name: displayName(message.from),
      };
      const outcome = await resolveAmountPrompt(
        message.reply_to_message.message_id,
        actor,
        message.text
      );
      if (outcome === "invalid") {
        await sendTelegramMessage(
          chatId,
          "⚠️ Не удалось распознать сумму. Ответьте на то же сообщение и укажите число, например: 15000000",
          { replyToMessageId: message.message_id }
        );
      } else if (outcome === "ok") {
        revalidatePath("/admin/requests");
        revalidatePath("/admin");
      }
    }
    return;
  }

  if (message.chat.type !== "private") return;

  if (message.contact) {
    await handleCustomerContact(chatId, message.contact);
    await clearPendingRegistration(chatId);
    return;
  }

  if (message.text === "/start") {
    await sendTelegramMessage(
      chatId,
      "👋 Здравствуйте! Я бот Molly Home.\n\nЕсли вы <b>менеджер</b> — напишите своё имя в ответ, чтобы вас узнавали в истории заказов.\nЕсли вы <b>клиент</b> — поделитесь номером телефона кнопкой ниже, чтобы проверить статус заявки.",
      { replyMarkup: REQUEST_CONTACT_KEYBOARD }
    );
    await setPendingRegistration(chatId);
    return;
  }

  if (message.text && message.from) {
    const wasPending = await consumePendingRegistration(chatId);
    if (wasPending) {
      const name = message.text.trim().slice(0, 80);
      await registerEmployeeName(String(message.from.id), name);
      await sendTelegramMessage(
        chatId,
        `✅ Записал вас как «${name}». Ваши действия в заказах теперь будут подписаны этим именем.`
      );
      return;
    }
    await sendTelegramMessage(
      chatId,
      "👋 Если вы менеджер — напишите своё имя. Если вы клиент — поделитесь номером телефона кнопкой ниже.",
      { replyMarkup: REQUEST_CONTACT_KEYBOARD }
    );
    await setPendingRegistration(chatId);
  }
}

async function handleCustomerContact(chatId: number, contact: TelegramContact) {
  const digits = contact.phone_number.replace(/\D/g, "");

  const [latest] = await db
    .select()
    .from(requests)
    .where(
      sql`regexp_replace(${requests.customerPhone}, '[^0-9]', '', 'g') = ${digits}`
    )
    .orderBy(desc(requests.createdAt))
    .limit(1);

  if (!latest) {
    await sendTelegramMessage(
      chatId,
      "Заявок с этим номером не найдено. Оставить заявку можно на molly.uz/request"
    );
    return;
  }

  await db
    .update(customers)
    .set({ telegramId: String(chatId), telegramNotifyOptIn: true })
    .where(
      sql`regexp_replace(${customers.phone}, '[^0-9]', '', 'g') = ${digits}`
    );

  const label = REQUEST_STATUS_LABELS[latest.status as RequestStatus];
  await sendTelegramMessage(
    chatId,
    `Статус вашей последней заявки: <b>${label}</b>\n\nМы уведомим вас здесь, когда статус изменится.`
  );
}
