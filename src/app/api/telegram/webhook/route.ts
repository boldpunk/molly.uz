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
  CLIENT_LINKS_KEYBOARD,
  WELCOME_KEYBOARD,
  CLIENT_BUTTONS,
  CLIENT_REPLY_KEYBOARD,
  MANAGER_BUTTONS,
  MANAGER_REPLY_KEYBOARD,
  escapeHtml,
} from "@/lib/telegram";
import { getContactInfo } from "@/lib/data";
import { SITE_URL } from "@/lib/site";
import {
  handleOrderAction,
  startAmountPrompt,
  startNewOrderPrompt,
  resolveReplyPrompt,
  submitEmployeeApplication,
  setPendingRegistration,
  consumePendingRegistration,
  clearPendingRegistration,
  isApprovedEmployee,
  sendRequestsOverview,
  sendOrderCardTo,
} from "@/lib/order-bot";
import {
  sendCategoryList,
  sendProductList,
  sendProductCard,
  startProductQuestion,
  consumeProductQuestion,
  relayProductQuestion,
} from "@/lib/bot-catalog";
import {
  startConversation,
  ensureConversation,
  relayCustomerMessage,
  closeConversation,
  sendOpenConversationsList,
} from "@/lib/bot-conversations";
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

  // Telegram only waits a short while for this response; if we reply after
  // doing the work, any slow downstream call (DB, a relay to ten managers)
  // turns into "Read timeout expired", a redelivery, and a backlog. So the
  // update is acknowledged now and handled afterwards — this is a
  // long-running Node server, so the work carries on after the response.
  void processUpdate(update).catch((err) => {
    console.error("Telegram update failed", update.update_id, err);
  });

  return NextResponse.json({ ok: true });
}

async function processUpdate(update: TelegramUpdate): Promise<void> {
  if (update.callback_query) {
    await handleCallbackQuery(update.callback_query);
  } else if (update.message) {
    await handleMessage(update.message);
  }
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
        `Нажмите «${CLIENT_BUTTONS.status}» внизу — бот попросит номер телефона и покажет статус вашей заявки.`,
        { replyMarkup: CLIENT_REPLY_KEYBOARD }
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

  if (chatId && cq.data && cq.data.startsWith("conv:")) {
    await answerCallbackQuery(cq.id);
    if (cq.data === "conv:new") {
      await startConversation(chatId, displayName(cq.from));
    } else if (cq.data.startsWith("conv:close:")) {
      const conversationId = cq.data.slice("conv:close:".length);
      await closeConversation(conversationId, chatId, displayName(cq.from));
    }
    return;
  }

  if (chatId && cq.data && cq.data.startsWith("req:")) {
    await answerCallbackQuery(cq.id);
    const staffChatIdValue = getStaffChatId();
    const isAuthorized =
      (staffChatIdValue && String(chatId) === String(staffChatIdValue)) ||
      (await isApprovedEmployee(String(chatId)));
    if (!isAuthorized) return;
    if (cq.data === "req:dialogs") {
      await sendOpenConversationsList(chatId);
    } else if (cq.data.startsWith("req:list:")) {
      await sendRequestsOverview(chatId, Number(cq.data.slice("req:list:".length)) || 0);
    } else if (cq.data.startsWith("req:show:")) {
      await sendOrderCardTo(chatId, cq.data.slice("req:show:".length));
    }
    return;
  }

  const staffChatId = getStaffChatId();
  const isStaffGroup = Boolean(chatId && staffChatId && String(chatId) === String(staffChatId));
  const isEmployeeDm = chatId ? await isApprovedEmployee(String(chatId)) : false;
  if (!chatId || !(isStaffGroup || isEmployeeDm)) {
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
    await startAmountPrompt(
      isStaffGroup ? staffChatId! : chatId,
      parsed.requestId,
      result.promptKind,
      actor
    );
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

    if (message.text && /^\/dialogs(@\w+)?\s*$/i.test(message.text.trim())) {
      await sendOpenConversationsList(chatId);
      return;
    }

    if (message.text && /^\/requests(@\w+)?\s*$/i.test(message.text.trim())) {
      await sendRequestsOverview(chatId);
      return;
    }

    if (message.reply_to_message && message.text && message.from) {
      const actor = {
        telegramId: String(message.from.id),
        name: displayName(message.from),
      };
      const result = await resolveReplyPrompt(
        chatId,
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
      } else if (
        result.kind === "conversation_reply_ok" ||
        result.kind === "product_question_reply_ok"
      ) {
        await sendTelegramMessage(chatId, "✅ Отправлено клиенту.", {
          replyToMessageId: message.message_id,
        });
      }
    }
    return;
  }

  if (message.chat.type !== "private") return;

  // A manager replying from their own DM (not the group) to a relayed
  // customer message — resolveReplyPrompt only matches messages we actually
  // sent to this exact chat, so a stranger can't hijack someone else's
  // conversation by guessing a message id.
  if (message.reply_to_message && message.text && message.from) {
    const actor = { telegramId: String(message.from.id), name: displayName(message.from) };
    const result = await resolveReplyPrompt(
      chatId,
      message.reply_to_message.message_id,
      actor,
      message.text
    );
    if (
      result.kind === "conversation_reply_ok" ||
      result.kind === "product_question_reply_ok"
    ) {
      await sendTelegramMessage(chatId, "✅ Отправлено клиенту.");
      return;
    }
    if (result.kind === "new_order_invalid") {
      await sendTelegramMessage(chatId, `⚠️ ${result.reason}`, {
        replyToMessageId: message.message_id,
      });
      return;
    }
    if (result.kind === "new_order_ok") {
      await sendTelegramMessage(chatId, "✅ Заказ создан — карточка отправлена в группу и сотрудникам.");
      revalidatePath("/admin/requests");
      revalidatePath("/admin");
      return;
    }
  }

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

    if (await isApprovedEmployee(String(chatId))) {
      await sendTelegramMessage(
        chatId,
        "👋 С возвращением! Вы подтверждённый сотрудник Molly Home.\n\nМеню — на кнопках внизу. Чтобы ответить клиенту, нажмите «Ответить» на его сообщении.",
        { replyMarkup: MANAGER_REPLY_KEYBOARD }
      );
      return;
    }

    // The welcome carries the bottom keyboard, so every customer action is
    // always one tap away; the follow-up offers the catalog and, quietly at
    // the end, staff sign-up.
    await sendTelegramMessage(
      chatId,
      "👋 Добро пожаловать в Molly Home — мебельную фабрику в Ташкенте.\n\nНапишите сюда любой вопрос — его сразу получит менеджер, а ответ придёт в этот чат. Меню — на кнопках внизу 👇",
      { replyMarkup: CLIENT_REPLY_KEYBOARD }
    );
    await sendTelegramMessage(chatId, "Или начните с каталога:", {
      replyMarkup: WELCOME_KEYBOARD,
    });
    return;
  }

  if (message.text && /^\/requests(@\w+)?\s*$/i.test(message.text.trim())) {
    if (await isApprovedEmployee(String(chatId))) {
      await sendRequestsOverview(chatId);
    }
    return;
  }

  if (message.text && /^\/menu(@\w+)?\s*$/i.test(message.text.trim())) {
    if (await isApprovedEmployee(String(chatId))) {
      await sendTelegramMessage(chatId, "Меню сотрудника — на кнопках внизу 👇", {
        replyMarkup: MANAGER_REPLY_KEYBOARD,
      });
    } else {
      await sendTelegramMessage(chatId, "Меню — на кнопках внизу 👇", {
        replyMarkup: CLIENT_REPLY_KEYBOARD,
      });
    }
    return;
  }

  if (!message.text || !message.from) return;
  const text = message.text;
  const from = message.from;

  // 0. A tap on one of the bottom-keyboard buttons.
  if (await handleMenuButton(chatId, text.trim(), from)) return;

  // 1. A question about a specific product the person just chose to ask.
  const question = await consumeProductQuestion(chatId);
  if (question) {
    await relayProductQuestion(chatId, displayName(from), question.productName, text);
    await sendTelegramMessage(
      chatId,
      "✅ Вопрос отправлен менеджеру. Ответ придёт сюда же."
    );
    return;
  }

  // 2. Someone who tapped "Я сотрудник" and is now giving their name.
  if (await consumePendingRegistration(chatId)) {
    const name = text.trim().slice(0, 80);
    const outcome = await submitEmployeeApplication(String(from.id), name);
    await sendTelegramMessage(
      chatId,
      outcome === "already_staff"
        ? `✅ Обновил имя на «${name}».`
        : `📨 Заявка отправлена администратору как «${name}». После подтверждения вы начнёте получать заявки.`
    );
    return;
  }

  // 3. Staff typing freely: they are known, so show what they can do.
  if (await isApprovedEmployee(String(chatId))) {
    await sendTelegramMessage(
      chatId,
      "Чтобы ответить клиенту, нажмите «Ответить» на его сообщении. Остальное — на кнопках внизу 👇",
      { replyMarkup: MANAGER_REPLY_KEYBOARD }
    );
    return;
  }

  // 4. Everyone else is a customer, and a customer typing wants a person.
  // Their message goes straight to the managers — previously it was met with
  // "who are you?", which is where people gave up.
  const conversation = await ensureConversation(chatId, displayName(from));
  await relayCustomerMessage(chatId, displayName(from), text);
  await sendTelegramMessage(
    chatId,
    conversation.created
      ? "✅ Передал ваше сообщение менеджеру. Ответ придёт в этот чат — обычно в течение рабочего дня."
      : "✅ Передал менеджеру."
  );
}

const MANAGER_HELP =
  "<b>Как работать с ботом</b>\n\n" +
  "• Новые заявки приходят в группу и вам в личку — меняйте статус кнопками под карточкой.\n" +
  "• Чтобы ответить клиенту, нажмите «Ответить» на его сообщении и напишите текст — бот перешлёт его клиенту. Отвечать можно несколько раз.\n" +
  `• «${MANAGER_BUTTONS.requests}» — заявки в работе, «${MANAGER_BUTTONS.dialogs}» — открытые переписки с клиентами.\n` +
  `• «${MANAGER_BUTTONS.newOrder}» — создать заказ вручную: бот пришлёт шаблон, ответьте на него данными клиента.`;

// Bottom-keyboard buttons send their label as text. Returns true when the
// text was one of them, so it isn't also relayed to a manager.
async function handleMenuButton(chatId: number, text: string, from: TelegramFrom): Promise<boolean> {
  const staffButtons = Object.values(MANAGER_BUTTONS) as string[];
  if (staffButtons.includes(text) && (await isApprovedEmployee(String(chatId)))) {
    if (text === MANAGER_BUTTONS.requests) await sendRequestsOverview(chatId);
    else if (text === MANAGER_BUTTONS.dialogs) await sendOpenConversationsList(chatId);
    else if (text === MANAGER_BUTTONS.newOrder)
      await startNewOrderPrompt({ telegramId: String(from.id), name: displayName(from) }, chatId);
    else if (text === MANAGER_BUTTONS.catalog) await sendCategoryList(chatId);
    else await sendTelegramMessage(chatId, MANAGER_HELP, { replyMarkup: MANAGER_REPLY_KEYBOARD });
    return true;
  }

  switch (text) {
    case CLIENT_BUTTONS.catalog:
      await sendCategoryList(chatId);
      return true;
    case CLIENT_BUTTONS.manager:
      await startConversation(chatId, displayName(from));
      return true;
    case CLIENT_BUTTONS.status:
      // Normally this button shares the contact; typed by hand it can't.
      await sendTelegramMessage(
        chatId,
        `Нажмите кнопку «${CLIENT_BUTTONS.status}» внизу и подтвердите отправку номера — я найду вашу заявку.`,
        { replyMarkup: CLIENT_REPLY_KEYBOARD }
      );
      return true;
    case CLIENT_BUTTONS.measure:
      await sendTelegramMessage(
        chatId,
        "📝 <b>Бесплатный замер</b>\n\nОставьте заявку на сайте или просто напишите сюда адрес и удобное время — менеджер перезвонит и согласует выезд.",
        {
          replyMarkup: {
            inline_keyboard: [
              [{ text: "📝 Оставить заявку на сайте", url: `${SITE_URL}/request` }],
              [{ text: "🧩 Собрать шкаф в конфигураторе", url: `${SITE_URL}/configurator/shkaf` }],
            ],
          },
        }
      );
      return true;
    case CLIENT_BUTTONS.contacts: {
      const c = await getContactInfo();
      const lines = [
        "📞 <b>Контакты Molly Home</b>",
        "",
        `Телефон: ${escapeHtml(c.phone)}`,
        c.hours ? `Часы работы: ${escapeHtml(c.hours)}` : "",
        c.address ? `Адрес: ${escapeHtml(c.address)}` : "",
        c.addressNote ? escapeHtml(c.addressNote) : "",
        c.instagram ? `Instagram: @${escapeHtml(c.instagram)}` : "",
      ].filter(Boolean);
      const buttons = [
        [{ text: "🗺 Открыть на карте", url: `https://yandex.uz/maps/?pt=${c.mapLng},${c.mapLat}&z=16&l=map` }],
        [{ text: "🌐 Сайт molly.uz", url: SITE_URL }],
      ];
      if (c.instagram) buttons.push([{ text: "📸 Instagram", url: `https://www.instagram.com/${c.instagram}` }]);
      await sendTelegramMessage(chatId, lines.join("\n"), { replyMarkup: { inline_keyboard: buttons } });
      return true;
    }
  }
  return false;
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
