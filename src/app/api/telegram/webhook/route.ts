import { NextRequest, NextResponse } from "next/server";
import { eq, desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { requests, customers, StatusHistoryEntry } from "@/db/schema";
import {
  sendTelegramMessage,
  answerCallbackQuery,
  editTelegramMessage,
  parseStatusCallbackData,
  notifyCustomerStatusChange,
  REQUEST_CONTACT_KEYBOARD,
} from "@/lib/telegram";
import { REQUEST_STATUS_LABELS, RequestStatus } from "@/lib/types";

interface TelegramContact {
  phone_number: string;
}

interface TelegramMessage {
  chat: { id: number };
  text?: string;
  contact?: TelegramContact;
}

interface TelegramCallbackQuery {
  id: string;
  data?: string;
  message?: { chat: { id: number }; message_id: number; text?: string };
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

async function handleMessage(message: TelegramMessage) {
  const chatId = message.chat.id;

  if (message.contact) {
    // Compare digits only: Telegram's contact number has no "+"/spaces,
    // while stored phone numbers keep whatever format the customer typed.
    const digits = message.contact.phone_number.replace(/\D/g, "");

    const [latest] = await db
      .select()
      .from(requests)
      .where(
        sql`regexp_replace(${requests.customerPhone}, '\D', '', 'g') = ${digits}`
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
        sql`regexp_replace(${customers.phone}, '\D', '', 'g') = ${digits}`
      );

    const label = REQUEST_STATUS_LABELS[latest.status as RequestStatus];
    await sendTelegramMessage(
      chatId,
      `Статус вашей последней заявки: <b>${label}</b>\n\nМы уведомим вас здесь, когда статус изменится.`
    );
    return;
  }

  await sendTelegramMessage(
    chatId,
    "👋 Здравствуйте! Я бот Molly Home.\n\nПоделитесь номером телефона, чтобы проверить статус заявки, или свяжитесь с менеджером напрямую: +998 94 608 50 05",
    { replyMarkup: REQUEST_CONTACT_KEYBOARD }
  );
}

async function handleCallbackQuery(callbackQuery: TelegramCallbackQuery) {
  const parsed = callbackQuery.data
    ? parseStatusCallbackData(callbackQuery.data)
    : null;

  if (!parsed) {
    await answerCallbackQuery(callbackQuery.id);
    return;
  }

  const { requestId, status } = parsed;

  const [current] = await db
    .select({
      status: requests.status,
      statusHistory: requests.statusHistory,
      customerId: requests.customerId,
    })
    .from(requests)
    .where(eq(requests.id, requestId))
    .limit(1);

  if (!current) {
    await answerCallbackQuery(callbackQuery.id, "Заявка не найдена");
    return;
  }

  const statusHistory: StatusHistoryEntry[] = current.statusHistory ?? [];
  const nextHistory = [
    ...statusHistory,
    { status, changedAt: new Date().toISOString() },
  ];

  await db
    .update(requests)
    .set({ status, statusHistory: nextHistory, updatedAt: new Date() })
    .where(eq(requests.id, requestId));

  await answerCallbackQuery(
    callbackQuery.id,
    `Статус: ${REQUEST_STATUS_LABELS[status]}`
  );

  const originalMessage = callbackQuery.message;
  if (originalMessage) {
    const updatedText = `${originalMessage.text ?? ""}\n\n✅ Статус обновлён: ${REQUEST_STATUS_LABELS[status]}`;
    await editTelegramMessage(
      originalMessage.chat.id,
      originalMessage.message_id,
      updatedText
    );
  }

  if (current.customerId) {
    const [customer] = await db
      .select({
        telegramId: customers.telegramId,
        telegramNotifyOptIn: customers.telegramNotifyOptIn,
      })
      .from(customers)
      .where(eq(customers.id, current.customerId))
      .limit(1);

    if (customer?.telegramId && customer.telegramNotifyOptIn) {
      await notifyCustomerStatusChange(customer.telegramId, status);
    }
  }

  revalidatePath("/admin/requests");
  revalidatePath(`/admin/requests/${requestId}`);
  revalidatePath("/admin");
}
