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
  CLIENT_LINKS_KEYBOARD,
  ROLE_KEYBOARD,
} from "@/lib/telegram";
import {
  handleOrderAction,
  startAmountPrompt,
  startNewOrderPrompt,
  resolveReplyPrompt,
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
  const chatId = cq.message?.chat.id;

  // Explicit role choice from the private-chat onboarding prompt — replaces
  // the old "just type your name" flow, which silently registered ANY
  // free-text reply (even from a customer) as staff, via registerEmployeeName.
  if (chatId && (cq.data === "role:client" || cq.data === "role:manager")) {
    await answerCallbackQuery(cq.id);
    if (cq.data === "role:client") {
      await clearPendingRegistration(chatId);
      await sendTelegramMessage(
        chatId,
        "Поделитесь номером телефона кнопкой ниже — я найду вашу заявку и покажу статус.",
        { replyMarkup: REQUEST_CONTACT_KEYBOARD }
      );
    } else {
      await sendTelegramMessage(
        chatId,
        "Напишите своё имя ответным сообщением — так вас будут узнавать в истории заказов."
      );
      await setPendingRegistration(chatId);
    }
    return;
  }

  const staffChatId = getStaffChatId();
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

  // Works in any chat — a group's chat_id changes if Telegram migrates it to
  // a supergroup, so this is the fastest way to recover the current value
  // for TELEGRAM_STAFF_CHAT_ID (or a manager's own id for DM notifications)
  // without a third-party bot.
  if (message.text && /^\/chatid(@\w+)?\s*$/i.test(message.text.trim())) {
    await sendTelegramMessage(
      chatId,
      `Chat ID: <code>${chatId}</code>\nТип: ${message.chat.type}`
    );
    return;
  }

  if (staffChatId && String(chatId) === String(staffChatId)) {
    if (message.text && /^\/new(@\w+)?\s*$/i.test(message.text.trim()) && message.from) {
      const actor = {
        telegramId: String(message.from.id),
        name: displayName(message.from),
      };
      await startNewOrderPrompt(actor);
      return;
    }

    if (message.reply_to_message && message.text && message.from) {
      const actor = {
        telegramId: String(message.from.id),
        name: displayName(message.from),
      };
      const result = await resolveReplyPrompt(
        message.reply_to_message.message_id,
        actor,
        message.text
      );
      if (result.kind === "amount_invalid") {
        await sendTelegramMessage(
          chatId,
          "⚠️ Не удалось распознать сумму. Ответьте на то же сообщение и укажите число, например: 15000000",
          { replyToMessageId: message.message_id }
        );
      } else if (result.kind === "amount_ok") {
        revalidatePath("/admin/requests");
        revalidatePath("/admin");
      } else if (result.kind === "new_order_invalid") {
        await sendTelegramMessage(chatId, `⚠️ ${result.reason}`, {
          replyToMessageId: message.message_id,
        });
      } else if (result.kind === "new_order_ok") {
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

  const startMatch = message.text?.match(/^\/start(?:@\w+)?(?:\s+(\S+))?\s*$/);
  if (startMatch) {
    const payload = startMatch[1];
    // Deep link from the site's own "Проверить статус" button — it embeds
    // the phone digits the request was submitted with (see buildStatusDeepLink
    // in src/lib/telegram-links.ts), so a customer coming from their own
    // confirmation page sees their status immediately instead of having to
    // tap through the share-contact flow below.
    if (payload && payload.startsWith("p_") && /^p_\d{5,15}$/.test(payload)) {
      const digits = payload.slice(2);
      await sendRequestStatusByPhone(chatId, digits);
      return;
    }

    await clearPendingRegistration(chatId);
    await sendTelegramMessage(
      chatId,
      "👋 Добро пожаловать в Molly Home — мебельную фабрику в Ташкенте!\n\nЧерез этого бота вы можете:\n✅ Проверить статус своего заказа в любое время\n🔔 Получать уведомления, когда статус меняется — не нужно звонить и уточнять\n🛋 Посмотреть каталог и оставить заявку на замер",
      { replyMarkup: CLIENT_LINKS_KEYBOARD }
    );
    await sendTelegramMessage(chatId, "Кто вы?", { replyMarkup: ROLE_KEYBOARD });
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
    // No pending manager-name prompt active — never guess. Free text alone
    // used to silently register the sender as staff; now it just re-shows
    // the explicit role choice.
    await sendTelegramMessage(chatId, "Уточните, пожалуйста, кто вы:", {
      replyMarkup: ROLE_KEYBOARD,
    });
  }
}

async function handleCustomerContact(chatId: number, contact: TelegramContact) {
  const digits = contact.phone_number.replace(/\D/g, "");
  await sendRequestStatusByPhone(chatId, digits);
}

async function sendRequestStatusByPhone(chatId: number, digits: string) {
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
      "Заявок с этим номером не найдено. Вы можете посмотреть каталог или оставить заявку на замер:",
      { replyMarkup: CLIENT_LINKS_KEYBOARD }
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
    `Статус вашей последней заявки: <b>${label}</b>\n\nМы уведомим вас здесь, когда статус изменится.`,
    { replyMarkup: CLIENT_LINKS_KEYBOARD }
  );
}
