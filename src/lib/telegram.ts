import { REQUEST_STATUS_LABELS, RequestStatus } from "./types";
import { SITE_URL } from "./site";
import { formatSum } from "./format";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const STAFF_CHAT_ID = process.env.TELEGRAM_STAFF_CHAT_ID;

export function isTelegramBotConfigured(): boolean {
  return Boolean(BOT_TOKEN);
}

export function isStaffNotifyConfigured(): boolean {
  return Boolean(BOT_TOKEN && STAFF_CHAT_ID);
}

async function callTelegramApi(
  method: string,
  payload: Record<string, unknown>
): Promise<unknown> {
  if (!BOT_TOKEN) return null;
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/${method}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    if (!res.ok) {
      console.error("Telegram API error", method, await res.text());
      return null;
    }
    return await res.json();
  } catch (err) {
    console.error("Telegram API request failed", method, err);
    return null;
  }
}

export async function sendTelegramMessage(
  chatId: string | number,
  text: string,
  options?: {
    replyMarkup?: Record<string, unknown>;
  }
): Promise<void> {
  await callTelegramApi("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    reply_markup: options?.replyMarkup,
  });
}

export async function answerCallbackQuery(
  callbackQueryId: string,
  text?: string
): Promise<void> {
  await callTelegramApi("answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    text,
  });
}

export async function editTelegramMessage(
  chatId: string | number,
  messageId: number,
  text: string
): Promise<void> {
  // Plain text (no parse_mode): the original message text comes back from
  // Telegram with formatting entities stripped, so re-sending it under
  // parse_mode HTML risks mis-parsing stray "<"/"&"/">" from customer input.
  await callTelegramApi("editMessageText", {
    chat_id: chatId,
    message_id: messageId,
    text,
  });
}

export const REQUEST_CONTACT_KEYBOARD = {
  keyboard: [
    [{ text: "📱 Поделиться номером — проверить статус", request_contact: true }],
  ],
  resize_keyboard: true,
};

const STATUS_CODES: Record<RequestStatus, string> = {
  new: "n",
  contacted: "c",
  measured: "m",
  in_production: "p",
  ready_delivered: "r",
};

const CODE_TO_STATUS: Record<string, RequestStatus> = Object.fromEntries(
  Object.entries(STATUS_CODES).map(([status, code]) => [code, status])
) as Record<string, RequestStatus>;

export function statusToCallbackData(requestId: string, status: RequestStatus) {
  return `st:${requestId}:${STATUS_CODES[status]}`;
}

export function parseStatusCallbackData(
  data: string
): { requestId: string; status: RequestStatus } | null {
  const match = /^st:([0-9a-f-]{36}):([a-z])$/.exec(data);
  if (!match) return null;
  const status = CODE_TO_STATUS[match[2]];
  if (!status) return null;
  return { requestId: match[1], status };
}

interface NewRequestNotification {
  id: string;
  customerName: string;
  customerPhone: string;
  notes: string;
  items: {
    productName: string;
    hardwareLabel?: string | null;
    colourLabel?: string | null;
    widthMetres?: number | null;
    estimate?: number | null;
  }[];
}

export async function notifyStaffNewRequest(
  request: NewRequestNotification
): Promise<void> {
  if (!isStaffNotifyConfigured()) return;

  const lines = [
    "🆕 <b>Новая заявка</b>",
    `👤 ${escapeHtml(request.customerName)}, ${escapeHtml(request.customerPhone)}`,
  ];

  if (request.items.length > 0) {
    lines.push("");
    request.items.forEach((item, i) => {
      const parts = [item.productName];
      if (item.hardwareLabel) parts.push(item.hardwareLabel);
      if (item.colourLabel) parts.push(item.colourLabel);
      if (item.widthMetres) parts.push(`${item.widthMetres} м`);
      let line = `${i + 1}. ${escapeHtml(parts.join(" — "))}`;
      if (item.estimate) line += ` — ~${formatSum(item.estimate)}`;
      lines.push(line);
    });
  }

  if (request.notes) {
    lines.push("", `📝 ${escapeHtml(request.notes)}`);
  }

  lines.push("", `<a href="${SITE_URL}/admin/requests/${request.id}">Открыть в Mebelflow</a>`);

  const buttons = [
    [
      {
        text: "✅ Связался",
        callback_data: statusToCallbackData(request.id, "contacted"),
      },
      {
        text: "📏 Замерено",
        callback_data: statusToCallbackData(request.id, "measured"),
      },
    ],
    [
      {
        text: "🏭 В производстве",
        callback_data: statusToCallbackData(request.id, "in_production"),
      },
      {
        text: "🎉 Готово",
        callback_data: statusToCallbackData(request.id, "ready_delivered"),
      },
    ],
  ];

  await sendTelegramMessage(STAFF_CHAT_ID!, lines.join("\n"), {
    replyMarkup: { inline_keyboard: buttons },
  });
}

export async function notifyCustomerStatusChange(
  telegramId: string,
  status: RequestStatus
): Promise<void> {
  const label = REQUEST_STATUS_LABELS[status];
  await sendTelegramMessage(
    telegramId,
    `Статус вашей заявки обновлён: <b>${escapeHtml(label)}</b>\n\nЕсли у вас есть вопросы — напишите нам: +998 94 608 50 05`
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
