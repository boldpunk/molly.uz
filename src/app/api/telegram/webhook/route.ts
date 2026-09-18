import { NextRequest, NextResponse } from "next/server";
import { desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { requests, customers, telegramProcessedUpdates } from "@/db/schema";
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
  submitEmployeeApplication,
  setPendingRegistration,
  consumePendingRegistration,
  clearPendingRegistration,
} from "@/lib/order-bot";
import {
  sendCategoryList,
  sendProductList,
  sendProductCard,
  startProductQuestion,
  consumeProductQuestion,
  relayProductQuestion,
} from "@/lib/bot-catalog";
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
  update_id: number;
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

  // Telegram redelivers an update if our response was slow or dropped —
  // without this, a redelivered update would re-post an order card or
  // re-apply a manager's status change a second time.
  if (typeof update.update_id === "number") {
    const inserted = await db
      .insert(telegramProcessedUpdates)
      .values({ updateId: String(update.update_id) })
      .onConflictDoNothing()
      .returning({ updateId: telegramProcessedUpdates.updateId });
    if (inserted.length === 0) {
      return NextResponse.json({ ok: true });
    }
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

  if (chatId && cq.data && cq.data.startsWith("cat:")) {
    await answerCallbackQuery(cq.id);
    const parts = cq.data.split(":");
    const sub = parts[1];
    if (sub === "root") {
      await sendCategoryList(chatId);
    } else if (sub === "c") {
      const [, , slug, pageStr] = parts;
      await sendProductList(chatId, slug, Number(pageStr) || 0);
    } else if (sub === "p") {
      const [, , productId] = parts;
      await sendProductCard(chatId, productId);
    } else if (sub === "ask") {
      const [, , productId] = parts;
      await startProductQuestion(chatId, productId);
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
  } else if (result.kind === "already_claimed") {
    await answerCallbackQuery(cq.id, "Уже взято в работу другим менеджером");
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
    const question = await consumeProductQuestion(chatId);
    if (question) {
      await relayProductQuestion(
        chatId,
        displayName(message.from),
        question.productName,
        message.text
      );
      await sendTelegramMessage(
        chatId,
        "✅ Вопрос отправлен менеджеру. Мы ответим вам здесь же."
      );
      return;
    }

    const wasPending = await consumePendingRegistration(chatId);
    if (wasPending) {
      const name = message.text.trim().slice(0, 80);
      const outcome = await submitEmployeeApplication(String(message.from.id), name);
      await sendTelegramMessage(
        chatId,
        outcome === "already_staff"
          ? `✅ Обновил имя на «${name}». Ваши действия в заказах теперь будут подписаны этим именем.`
          : `📨 Заявка отправлена администратору как «${name}». Как только вас подтвердят, вы начнёте получать уведомления о заказах.`
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
