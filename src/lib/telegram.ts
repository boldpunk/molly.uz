import { REQUEST_STATUS_LABELS, RequestStatus } from "./types";
import { SITE_URL } from "./site";
import { formatSum } from "./format";
import type { StatusHistoryEntry } from "@/db/schema";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const STAFF_CHAT_ID = process.env.TELEGRAM_STAFF_CHAT_ID;

export function isTelegramBotConfigured(): boolean {
  return Boolean(BOT_TOKEN);
}

export function isStaffNotifyConfigured(): boolean {
  return Boolean(BOT_TOKEN && STAFF_CHAT_ID);
}

export function getStaffChatId(): string | undefined {
  return STAFF_CHAT_ID;
}

interface TelegramApiMessage {
  message_id: number;
  chat: { id: number };
}

async function callTelegramApi<T = unknown>(
  method: string,
  payload: Record<string, unknown>
): Promise<T | null> {
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
    const body = await res.json();
    if (!res.ok || !body.ok) {
      console.error("Telegram API error", method, body);
      return null;
    }
    return body.result as T;
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
    replyToMessageId?: number;
  }
): Promise<TelegramApiMessage | null> {
  return callTelegramApi<TelegramApiMessage>("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    reply_markup: options?.replyMarkup,
    reply_to_message_id: options?.replyToMessageId,
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
  messageId: string | number,
  text: string,
  replyMarkup?: Record<string, unknown>
): Promise<void> {
  await callTelegramApi("editMessageText", {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: "HTML",
    reply_markup: replyMarkup,
  });
}

export const REQUEST_CONTACT_KEYBOARD = {
  keyboard: [
    [{ text: "📱 Поделиться номером — проверить статус", request_contact: true }],
  ],
  resize_keyboard: true,
};

// --- Order funnel (§3 of the MebelFlow bot spec) ------------------------

type ActionCode =
  | "contact"
  | "unreach"
  | "meet"
  | "noans"
  | "metdone"
  | "purchase"
  | "deposit"
  | "paidfull"
  | "prod"
  | "ship"
  | "back";

const STATUS_ORDER: RequestStatus[] = [
  "new_order",
  "contacted",
  "meeting_scheduled",
  "meeting_done",
  "purchase_request",
  "deposit_received",
  "paid_full",
  "in_production",
  "ready_shipment",
];

export function statusIndex(status: RequestStatus): number {
  return STATUS_ORDER.indexOf(status);
}

/** §3 Stage 7 note: back target depends on whether a deposit was recorded. */
export function backTarget(
  status: RequestStatus,
  hasDeposit: boolean
): RequestStatus | null {
  switch (status) {
    case "new_order":
      return null;
    case "contacted":
      return "new_order";
    case "meeting_scheduled":
      return "contacted";
    case "meeting_done":
      return "meeting_scheduled";
    case "purchase_request":
      return "meeting_done";
    case "deposit_received":
      return "purchase_request";
    case "paid_full":
      return hasDeposit ? "deposit_received" : "purchase_request";
    case "in_production":
      return "paid_full";
    case "ready_shipment":
      return "in_production";
  }
}

export function buildCallbackData(requestId: string, action: ActionCode): string {
  return `a:${requestId}:${action}`;
}

export function parseCallbackData(
  data: string
): { requestId: string; action: ActionCode } | null {
  const match = /^a:([0-9a-f-]{36}):([a-z]+)$/.exec(data);
  if (!match) return null;
  return { requestId: match[1], action: match[2] as ActionCode };
}

export function buildOrderCardKeyboard(
  requestId: string,
  status: RequestStatus,
  hasDeposit: boolean
): { inline_keyboard: { text: string; callback_data: string }[][] } {
  const cb = (action: ActionCode) => buildCallbackData(requestId, action);
  const backRow = () => [{ text: "🔄 Изменить статус", callback_data: cb("back") }];

  switch (status) {
    case "new_order":
      return {
        inline_keyboard: [
          [
            { text: "☎️ Связался", callback_data: cb("contact") },
            { text: "❌ Не дозвонился", callback_data: cb("unreach") },
          ],
        ],
      };
    case "contacted":
      return {
        inline_keyboard: [
          [
            { text: "🤝 Назначена встреча", callback_data: cb("meet") },
            { text: "🤔 Нет точного ответа", callback_data: cb("noans") },
          ],
          backRow(),
        ],
      };
    case "meeting_scheduled":
      return {
        inline_keyboard: [
          [{ text: "✅ Встреча состоялась", callback_data: cb("metdone") }],
          backRow(),
        ],
      };
    case "meeting_done":
      return {
        inline_keyboard: [
          [{ text: "📝 Заявка на покупку", callback_data: cb("purchase") }],
          backRow(),
        ],
      };
    case "purchase_request":
      return {
        inline_keyboard: [
          [
            { text: "💵 Оставили залог", callback_data: cb("deposit") },
            { text: "💰 Оплатили полную сумму", callback_data: cb("paidfull") },
          ],
          backRow(),
        ],
      };
    case "deposit_received":
      return {
        inline_keyboard: [
          [{ text: "💰 Оплатили полную сумму", callback_data: cb("paidfull") }],
          backRow(),
        ],
      };
    case "paid_full":
      return {
        inline_keyboard: [
          [{ text: "🚀 Передать в производство", callback_data: cb("prod") }],
          backRow(),
        ],
      };
    case "in_production":
      return {
        inline_keyboard: [
          [{ text: "📦 Готов к отгрузке", callback_data: cb("ship") }],
          backRow(),
        ],
      };
    case "ready_shipment":
      return { inline_keyboard: [backRow()] };
  }
  void hasDeposit;
  return { inline_keyboard: [] };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatHistoryLine(entry: StatusHistoryEntry): string {
  const date = new Date(entry.changedAt);
  const dateStr = date.toLocaleDateString("ru-RU");
  const timeStr = date.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const label =
    REQUEST_STATUS_LABELS[entry.status as RequestStatus] ?? entry.status;
  const parts = [`${dateStr} ${timeStr} — ${label}`];
  if (entry.note) parts.push(entry.note);
  if (entry.amount) parts.push(formatSum(entry.amount));
  const employee = entry.employeeName ? ` (${escapeHtml(entry.employeeName)})` : "";
  return escapeHtml(parts.join(" ")) + employee;
}

export interface OrderCardData {
  id: string;
  customerName: string;
  customerPhone: string;
  source: string;
  createdAt: Date | string;
  status: RequestStatus;
  statusHistory: StatusHistoryEntry[];
  orderNumber: string | null;
  totalAmount: number | null;
  depositAmount: number | null;
  paidAmount: number | null;
  assignedManagerName: string | null;
  items: { productName: string; hardwareLabel?: string | null; colourLabel?: string | null }[];
}

export function buildOrderCardText(order: OrderCardData): string {
  const created = new Date(order.createdAt);
  const lines = [
    REQUEST_STATUS_LABELS[order.status],
    "",
    `👤 ${escapeHtml(order.customerName)}`,
    `📞 ${escapeHtml(order.customerPhone)}`,
    `📍 Источник: ${escapeHtml(order.source)}`,
    `🕐 ${created.toLocaleString("ru-RU")}`,
  ];

  if (order.orderNumber) {
    lines.push(`🔖 Заказ: ${escapeHtml(order.orderNumber)}`);
  }
  if (order.assignedManagerName) {
    lines.push(`👔 Менеджер: ${escapeHtml(order.assignedManagerName)}`);
  }

  if (order.items.length > 0) {
    lines.push("");
    order.items.forEach((item, i) => {
      const parts = [item.productName];
      if (item.hardwareLabel) parts.push(item.hardwareLabel);
      if (item.colourLabel) parts.push(item.colourLabel);
      lines.push(`${i + 1}. ${escapeHtml(parts.join(" — "))}`);
    });
  }

  if (order.totalAmount || order.depositAmount || order.paidAmount) {
    lines.push("");
    if (order.totalAmount) lines.push(`💵 Сумма заказа: ${formatSum(order.totalAmount)}`);
    if (order.depositAmount) {
      lines.push(`💰 Залог: ${formatSum(order.depositAmount)}`);
      if (order.totalAmount) {
        lines.push(`📊 Остаток: ${formatSum(order.totalAmount - order.depositAmount)}`);
      }
    }
    if (order.paidAmount) lines.push(`✅ Оплачено: ${formatSum(order.paidAmount)}`);
  }

  if (order.statusHistory.length > 0) {
    lines.push("", "📜 История:");
    order.statusHistory.forEach((entry) => lines.push(formatHistoryLine(entry)));
  }

  lines.push("", `<a href="${SITE_URL}/admin/requests/${order.id}">Открыть в Mebelflow</a>`);

  return lines.join("\n");
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
