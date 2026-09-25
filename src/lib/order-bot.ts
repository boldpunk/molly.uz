import { eq, sql, desc } from "drizzle-orm";
import { db } from "@/db";
import {
  requests,
  requestItems,
  employees,
  employeeApplications,
  orderCounters,
  telegramPendingActions,
  customers,
  products,
  categories,
} from "@/db/schema";
import type { StatusHistoryEntry } from "@/db/schema";
import { RequestStatus, REQUEST_STATUSES, REQUEST_STATUS_LABELS } from "./types";
import {
  buildOrderCardText,
  buildOrderCardKeyboard,
  backTarget,
  sendTelegramMessage,
  escapeHtml,
  editTelegramMessage,
  getStaffChatId,
  isStaffNotifyConfigured,
  notifyCustomerStatusChange,
} from "./telegram";
import { resolveConversationReply } from "./bot-conversations";

interface Actor {
  telegramId: string;
  name: string;
}

async function notifyCustomerIfLinked(
  customerId: string | null,
  status: RequestStatus
): Promise<void> {
  if (!customerId) return;
  const [customer] = await db
    .select({
      telegramId: customers.telegramId,
      telegramNotifyOptIn: customers.telegramNotifyOptIn,
    })
    .from(customers)
    .where(eq(customers.id, customerId))
    .limit(1);
  if (customer?.telegramId && customer.telegramNotifyOptIn) {
    await notifyCustomerStatusChange(customer.telegramId, status).catch((err) =>
      console.error("Telegram customer notify failed", err)
    );
  }
}

export async function getOrCreateEmployeeName(
  telegramId: string,
  fallbackName: string
): Promise<string> {
  const [existing] = await db
    .select({ name: employees.name })
    .from(employees)
    .where(eq(employees.telegramId, telegramId))
    .limit(1);
  if (existing) return existing.name;

  await db
    .insert(employees)
    .values({ telegramId, name: fallbackName })
    .onConflictDoNothing({ target: employees.telegramId });
  return fallbackName;
}

export async function registerEmployeeName(
  telegramId: string,
  name: string
): Promise<void> {
  await db
    .insert(employees)
    .values({ telegramId, name })
    .onConflictDoUpdate({ target: employees.telegramId, set: { name } });
}

export type EmployeeApplicationOutcome = "already_staff" | "pending";

// Entry point for the bot's "Я менеджер" flow. Does NOT grant employee
// access (order-action attribution, new-order DM broadcast) — an
// administrator has to approve the application from /admin/employees.
// Someone already approved just gets their display name updated directly,
// no need to re-queue a trusted person.
export async function submitEmployeeApplication(
  telegramId: string,
  name: string
): Promise<EmployeeApplicationOutcome> {
  const [existing] = await db
    .select({ id: employees.id })
    .from(employees)
    .where(eq(employees.telegramId, telegramId))
    .limit(1);
  if (existing) {
    await registerEmployeeName(telegramId, name);
    return "already_staff";
  }

  await db
    .insert(employeeApplications)
    .values({ telegramId, name })
    .onConflictDoUpdate({ target: employeeApplications.telegramId, set: { name } });
  return "pending";
}

export async function setPendingRegistration(
  chatId: number | string
): Promise<void> {
  await db
    .insert(telegramPendingActions)
    .values({ key: `reg:${chatId}`, kind: "register_name" })
    .onConflictDoUpdate({
      target: telegramPendingActions.key,
      set: { kind: "register_name" },
    });
}

export async function consumePendingRegistration(
  chatId: number | string
): Promise<boolean> {
  const key = `reg:${chatId}`;
  const [row] = await db
    .select()
    .from(telegramPendingActions)
    .where(eq(telegramPendingActions.key, key))
    .limit(1);
  if (!row) return false;
  await db.delete(telegramPendingActions).where(eq(telegramPendingActions.key, key));
  return true;
}

export async function clearPendingRegistration(
  chatId: number | string
): Promise<void> {
  await db
    .delete(telegramPendingActions)
    .where(eq(telegramPendingActions.key, `reg:${chatId}`));
}

export async function nextOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const [row] = await db
    .insert(orderCounters)
    .values({ year, seq: 1 })
    .onConflictDoUpdate({
      target: orderCounters.year,
      set: { seq: sql`${orderCounters.seq} + 1` },
    })
    .returning({ seq: orderCounters.seq });
  return `MF-${year}-${String(row.seq).padStart(4, "0")}`;
}

async function loadOrderCard(requestId: string) {
  const [request] = await db
    .select()
    .from(requests)
    .where(eq(requests.id, requestId))
    .limit(1);
  if (!request) return null;

  const items = await db
    .select({
      productName: requestItems.productName,
      hardwareLabel: requestItems.hardwareLabel,
      colourLabel: requestItems.colourLabel,
    })
    .from(requestItems)
    .where(eq(requestItems.requestId, requestId));

  let assignedManagerName: string | null = null;
  if (request.assignedManagerId) {
    const [mgr] = await db
      .select({ name: employees.name })
      .from(employees)
      .where(eq(employees.id, request.assignedManagerId))
      .limit(1);
    assignedManagerName = mgr?.name ?? null;
  }

  return { request, items, assignedManagerName };
}

function buildOrderCardPayload(data: NonNullable<Awaited<ReturnType<typeof loadOrderCard>>>) {
  const text = buildOrderCardText({
    id: data.request.id,
    customerName: data.request.customerName,
    customerPhone: data.request.customerPhone,
    source: data.request.source,
    createdAt: data.request.createdAt,
    status: data.request.status as RequestStatus,
    statusHistory: data.request.statusHistory,
    orderNumber: data.request.orderNumber,
    totalAmount: data.request.totalAmount,
    depositAmount: data.request.depositAmount,
    paidAmount: data.request.paidAmount,
    assignedManagerName: data.assignedManagerName,
    items: data.items,
  });
  const keyboard = buildOrderCardKeyboard(
    data.request.id,
    data.request.status as RequestStatus,
    Boolean(data.request.depositAmount),
    !data.request.assignedManagerId
  );
  return { text, keyboard };
}

export async function postNewOrderCard(requestId: string): Promise<void> {
  if (!isStaffNotifyConfigured()) return;
  const data = await loadOrderCard(requestId);
  if (!data) return;

  const { text, keyboard } = buildOrderCardPayload(data);

  const sent = await sendTelegramMessage(getStaffChatId()!, text, {
    replyMarkup: keyboard,
  });
  if (sent) {
    await db
      .update(requests)
      .set({ telegramMessageId: String(sent.message_id) })
      .where(eq(requests.id, requestId));
  }

  // Also DM every registered employee directly — the group post can fail
  // (wrong/rotated chat id, bot removed, etc.) without anyone noticing for
  // days, since it's not always open. DMs get the same action keyboard as
  // the group now that handleCallbackQuery accepts actions from a confirmed
  // employee's own chat, not just the group (see isApprovedEmployee).
  const recipients = await db
    .select({ telegramId: employees.telegramId })
    .from(employees);
  await Promise.all(
    recipients
      .filter((r) => /^\d+$/.test(r.telegramId))
      .map((r) =>
        sendTelegramMessage(r.telegramId, `🆕 Новый заказ\n\n${text}`, {
          replyMarkup: keyboard,
        })
      )
  );
}

export async function refreshOrderCard(requestId: string): Promise<void> {
  if (!isStaffNotifyConfigured()) return;
  const data = await loadOrderCard(requestId);
  if (!data || !data.request.telegramMessageId) return;

  const { text, keyboard } = buildOrderCardPayload(data);

  await editTelegramMessage(
    getStaffChatId()!,
    data.request.telegramMessageId,
    text,
    keyboard
  );
}

// Posts a fresh copy of a request's order card into an arbitrary chat (a
// manager's own DM, not just the staff group), with the same action
// keyboard — used by the /requests overview so a manager can act on a
// request from wherever they're looking at it.
export async function sendOrderCardTo(
  chatId: number | string,
  requestId: string
): Promise<void> {
  const data = await loadOrderCard(requestId);
  if (!data) return;
  const { text, keyboard } = buildOrderCardPayload(data);
  await sendTelegramMessage(chatId, text, { replyMarkup: keyboard });
}

export async function isApprovedEmployee(telegramId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: employees.id })
    .from(employees)
    .where(eq(employees.telegramId, telegramId))
    .limit(1);
  return Boolean(row);
}

export async function sendRequestsOverview(
  chatId: number | string,
  page = 0
): Promise<void> {
  const PAGE_SIZE = 8;
  const all = await db
    .select({
      id: requests.id,
      customerName: requests.customerName,
      status: requests.status,
      orderNumber: requests.orderNumber,
      createdAt: requests.createdAt,
    })
    .from(requests)
    .orderBy(desc(requests.createdAt));

  if (all.length === 0) {
    await sendTelegramMessage(chatId, "Заявок пока нет.");
    return;
  }

  const counts = new Map<string, number>();
  for (const r of all) counts.set(r.status, (counts.get(r.status) ?? 0) + 1);
  const countsLines = REQUEST_STATUSES.map(
    (s) => `${REQUEST_STATUS_LABELS[s]}: ${counts.get(s) ?? 0}`
  ).join("\n");

  const totalPages = Math.ceil(all.length / PAGE_SIZE);
  const safePage = Math.min(Math.max(page, 0), totalPages - 1);
  const pageItems = all.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  const rows = pageItems.map((r) => [
    {
      text: `${r.orderNumber ? `${r.orderNumber} · ` : ""}${r.customerName} — ${REQUEST_STATUS_LABELS[r.status as RequestStatus]}`,
      callback_data: `req:show:${r.id}`,
    },
  ]);
  const navRow: { text: string; callback_data: string }[] = [];
  if (safePage > 0) navRow.push({ text: "⬅️", callback_data: `req:list:${safePage - 1}` });
  if (safePage < totalPages - 1) navRow.push({ text: "➡️", callback_data: `req:list:${safePage + 1}` });
  if (navRow.length > 0) rows.push(navRow);

  const pageLabel = totalPages > 1 ? ` (стр. ${safePage + 1} из ${totalPages})` : "";
  await sendTelegramMessage(
    chatId,
    `📋 Все заявки (${all.length})${pageLabel}\n\n${countsLines}\n\nНажмите на заявку, чтобы открыть карточку:`,
    { replyMarkup: { inline_keyboard: rows } }
  );
}

function appendHistory(
  current: StatusHistoryEntry[],
  entry: StatusHistoryEntry
): StatusHistoryEntry[] {
  return [...current, entry];
}

const DIRECT_ACTIONS: Partial<
  Record<string, { target: RequestStatus | null; note?: string }>
> = {
  contact: { target: "contacted" },
  unreach: { target: null, note: "Не дозвонился" },
  meet: { target: "meeting_scheduled" },
  noans: { target: null, note: "Нет точного ответа" },
  metdone: { target: "meeting_done" },
  purchase: { target: "purchase_request" },
  ship: { target: "ready_shipment" },
};

export type OrderActionResult =
  | { kind: "updated" }
  | { kind: "amount_prompt"; promptKind: "amount_deposit" | "amount_paid_full" }
  | { kind: "already_claimed" }
  | { kind: "noop" };

export async function handleOrderAction(
  requestId: string,
  action: string,
  actor: Actor
): Promise<OrderActionResult> {
  const [current] = await db
    .select()
    .from(requests)
    .where(eq(requests.id, requestId))
    .limit(1);
  if (!current) return { kind: "noop" };

  const employeeName = await getOrCreateEmployeeName(
    actor.telegramId,
    actor.name
  );
  const [employeeRow] = await db
    .select({ id: employees.id })
    .from(employees)
    .where(eq(employees.telegramId, actor.telegramId))
    .limit(1);

  if (action === "deposit" || action === "paidfull") {
    return {
      kind: "amount_prompt",
      promptKind: action === "deposit" ? "amount_deposit" : "amount_paid_full",
    };
  }

  if (action === "claim") {
    if (!employeeRow) return { kind: "noop" };
    // Conditional UPDATE, not a plain write: if two managers tap "Взять в
    // работу" on the same card near-simultaneously, only the first one's
    // WHERE clause still matches — the second gets 0 rows back instead of
    // silently overwriting the first manager's claim.
    const claimed = await db
      .update(requests)
      .set({
        assignedManagerId: employeeRow.id,
        statusHistory: appendHistory(current.statusHistory, {
          status: current.status as RequestStatus,
          changedAt: new Date().toISOString(),
          employeeTelegramId: actor.telegramId,
          employeeName,
          note: "Взял(а) в работу",
        }),
        updatedAt: new Date(),
      })
      .where(sql`${requests.id} = ${requestId} AND ${requests.assignedManagerId} IS NULL`)
      .returning({ id: requests.id });
    if (claimed.length === 0) {
      // Refresh so the manager who lost the race sees who actually has it
      // and the now-stale "Взять в работу" button disappears from their view.
      await refreshOrderCard(requestId);
      return { kind: "already_claimed" };
    }
    await refreshOrderCard(requestId);
    return { kind: "updated" };
  }

  if (action === "back") {
    const target = backTarget(
      current.status as RequestStatus,
      Boolean(current.depositAmount)
    );
    if (!target) return { kind: "noop" };
    await db
      .update(requests)
      .set({
        status: target,
        assignedManagerId: employeeRow?.id ?? current.assignedManagerId,
        statusHistory: appendHistory(current.statusHistory, {
          status: target,
          changedAt: new Date().toISOString(),
          employeeTelegramId: actor.telegramId,
          employeeName,
        }),
        updatedAt: new Date(),
      })
      .where(eq(requests.id, requestId));
    await refreshOrderCard(requestId);
    await notifyCustomerIfLinked(current.customerId, target);
    return { kind: "updated" };
  }

  if (action === "prod") {
    const orderNumber = current.orderNumber ?? (await nextOrderNumber());
    await db
      .update(requests)
      .set({
        status: "in_production",
        orderNumber,
        productionStartedAt: new Date(),
        assignedManagerId: employeeRow?.id ?? current.assignedManagerId,
        statusHistory: appendHistory(current.statusHistory, {
          status: "in_production",
          changedAt: new Date().toISOString(),
          employeeTelegramId: actor.telegramId,
          employeeName,
        }),
        updatedAt: new Date(),
      })
      .where(eq(requests.id, requestId));
    await refreshOrderCard(requestId);
    await notifyCustomerIfLinked(current.customerId, "in_production");
    return { kind: "updated" };
  }

  const direct = DIRECT_ACTIONS[action];
  if (!direct) return { kind: "noop" };

  await db
    .update(requests)
    .set({
      status: direct.target ?? current.status,
      assignedManagerId: employeeRow?.id ?? current.assignedManagerId,
      statusHistory: appendHistory(current.statusHistory, {
        status: direct.target ?? current.status,
        changedAt: new Date().toISOString(),
        employeeTelegramId: actor.telegramId,
        employeeName,
        note: direct.note,
      }),
      updatedAt: new Date(),
    })
    .where(eq(requests.id, requestId));
  await refreshOrderCard(requestId);
  if (direct.target) {
    await notifyCustomerIfLinked(current.customerId, direct.target);
  }
  return { kind: "updated" };
}

export async function startAmountPrompt(
  chatId: number | string,
  requestId: string,
  promptKind: "amount_deposit" | "amount_paid_full",
  actor: Actor
): Promise<void> {
  const label =
    promptKind === "amount_deposit"
      ? "сумму залога"
      : "сумму полной оплаты";
  const sent = await sendTelegramMessage(
    chatId,
    `💬 ${actor.name}, ответьте на это сообщение и укажите ${label} (в сумах), например: 15000000`
  );
  if (!sent) return;
  await db
    .insert(telegramPendingActions)
    .values({
      key: `msg:${sent.message_id}`,
      kind: promptKind,
      requestId,
    })
    .onConflictDoUpdate({
      target: telegramPendingActions.key,
      set: { kind: promptKind, requestId },
    });
}

export async function startNewOrderPrompt(actor: Actor): Promise<void> {
  const chatId = getStaffChatId();
  if (!chatId) return;
  const sent = await sendTelegramMessage(
    chatId,
    `📝 ${actor.name}, ответьте на это сообщение с данными заказа, каждое поле на новой строке:\n\nИмя клиента\nТелефон\nИсточник (необязательно)\nЗаметки (необязательно)\nТовары: Название1, Название2 (необязательно)\n\nНапример:\nИван Иванов\n+998901234567\nInstagram\nХочет кухню, 3 метра\nТовары: Кухня Модерн, Стол Лофт`
  );
  if (!sent) return;
  await db.insert(telegramPendingActions).values({
    key: `msg:${sent.message_id}`,
    kind: "new_order_entry",
  });
}

export type ReplyPromptResult =
  | { kind: "amount_ok" }
  | { kind: "amount_invalid" }
  | { kind: "new_order_ok"; requestId: string }
  | { kind: "new_order_invalid"; reason: string }
  | { kind: "conversation_reply_ok" }
  | { kind: "product_question_reply_ok" }
  | { kind: "not_found" };

export async function resolveReplyPrompt(
  promptMessageId: number,
  actor: Actor,
  text: string
): Promise<ReplyPromptResult> {
  const key = `msg:${promptMessageId}`;
  const [pending] = await db
    .select()
    .from(telegramPendingActions)
    .where(eq(telegramPendingActions.key, key))
    .limit(1);
  if (!pending) return { kind: "not_found" };

  if (pending.kind === "new_order_entry") {
    return resolveNewOrderPrompt(key, actor, text);
  }

  if (pending.kind === "product_question_reply") {
    if (!pending.payload) return { kind: "not_found" };
    let asker: { askerChatId?: string; productName?: string };
    try {
      asker = JSON.parse(pending.payload);
    } catch {
      return { kind: "not_found" };
    }
    if (!asker.askerChatId) return { kind: "not_found" };
    await sendTelegramMessage(
      asker.askerChatId,
      `💬 Ответ на ваш вопрос${
        asker.productName ? ` по «${escapeHtml(asker.productName)}»` : ""
      }\n\n${escapeHtml(text)}\n\n<i>${escapeHtml(actor.name)}, Molly Home</i>`
    );
    await db.delete(telegramPendingActions).where(eq(telegramPendingActions.key, key));
    return { kind: "product_question_reply_ok" };
  }

  if (pending.kind === "conversation_reply") {
    if (!pending.payload) return { kind: "not_found" };
    await resolveConversationReply(pending.payload, actor.name, text);
    await db.delete(telegramPendingActions).where(eq(telegramPendingActions.key, key));
    return { kind: "conversation_reply_ok" };
  }

  const outcome = await resolveAmountPrompt(pending, key, actor, text);
  return outcome === "ok"
    ? { kind: "amount_ok" }
    : outcome === "invalid"
      ? { kind: "amount_invalid" }
      : { kind: "not_found" };
}

async function resolveAmountPrompt(
  pending: typeof telegramPendingActions.$inferSelect,
  key: string,
  actor: Actor,
  text: string
): Promise<"ok" | "invalid" | "not_found"> {
  if (!pending.requestId) return "not_found";

  const digits = text.replace(/[^\d]/g, "");
  const amount = digits ? parseInt(digits, 10) : NaN;
  if (!Number.isFinite(amount) || amount <= 0) return "invalid";

  const [current] = await db
    .select()
    .from(requests)
    .where(eq(requests.id, pending.requestId))
    .limit(1);
  if (!current) return "not_found";

  const employeeName = await getOrCreateEmployeeName(
    actor.telegramId,
    actor.name
  );
  const [employeeRow] = await db
    .select({ id: employees.id })
    .from(employees)
    .where(eq(employees.telegramId, actor.telegramId))
    .limit(1);

  const targetStatus: RequestStatus =
    pending.kind === "amount_deposit" ? "deposit_received" : "paid_full";

  const historyEntry: StatusHistoryEntry = {
    status: targetStatus,
    changedAt: new Date().toISOString(),
    employeeTelegramId: actor.telegramId,
    employeeName,
    amount,
  };

  await db
    .update(requests)
    .set({
      status: targetStatus,
      assignedManagerId: employeeRow?.id ?? current.assignedManagerId,
      depositAmount:
        pending.kind === "amount_deposit" ? amount : current.depositAmount,
      paidAmount:
        pending.kind === "amount_paid_full" ? amount : current.paidAmount,
      paidAt: pending.kind === "amount_paid_full" ? new Date() : current.paidAt,
      statusHistory: appendHistory(current.statusHistory, historyEntry),
      updatedAt: new Date(),
    })
    .where(eq(requests.id, pending.requestId));

  await db
    .delete(telegramPendingActions)
    .where(eq(telegramPendingActions.key, key));

  await refreshOrderCard(pending.requestId);
  await notifyCustomerIfLinked(current.customerId, targetStatus);
  return "ok";
}

async function resolveNewOrderPrompt(
  key: string,
  actor: Actor,
  text: string
): Promise<ReplyPromptResult> {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const name = lines[0];
  const phone = lines[1];
  const source = lines[2] || "Ручной ввод";

  const remainingLines = lines.slice(3);
  const productsLineIndex = remainingLines.findIndex((l) => /^товары\s*:/i.test(l));
  let requestedProductNames: string[] = [];
  if (productsLineIndex !== -1) {
    requestedProductNames = remainingLines[productsLineIndex]
      .replace(/^товары\s*:\s*/i, "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    remainingLines.splice(productsLineIndex, 1);
  }
  let notes = remainingLines.join("\n");

  if (!name || !phone || phone.replace(/[^\d]/g, "").length < 7) {
    return {
      kind: "new_order_invalid",
      reason:
        "Нужно минимум 2 строки: имя клиента и телефон (номер должен содержать хотя бы 7 цифр).",
    };
  }

  const matchedProducts: {
    id: string;
    name: string;
    slug: string;
    categorySlug: string;
  }[] = [];
  if (requestedProductNames.length > 0) {
    const catalog = await db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        categorySlug: categories.slug,
      })
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.id));

    const unmatched: string[] = [];
    for (const requestedName of requestedProductNames) {
      const found = catalog.find(
        (p) => p.name.toLowerCase() === requestedName.toLowerCase()
      );
      if (found) matchedProducts.push(found);
      else unmatched.push(requestedName);
    }
    if (unmatched.length > 0) {
      const unmatchedNote = `Товары (не найдены в каталоге): ${unmatched.join(", ")}`;
      notes = notes ? `${notes}\n${unmatchedNote}` : unmatchedNote;
    }
  }

  const employeeName = await getOrCreateEmployeeName(
    actor.telegramId,
    actor.name
  );
  const [employeeRow] = await db
    .select({ id: employees.id })
    .from(employees)
    .where(eq(employees.telegramId, actor.telegramId))
    .limit(1);

  const orderNumber = await nextOrderNumber();

  const [created] = await db
    .insert(requests)
    .values({
      customerName: name,
      customerPhone: phone,
      notes,
      source,
      orderNumber,
      assignedManagerId: employeeRow?.id,
      statusHistory: [
        {
          status: "new_order",
          changedAt: new Date().toISOString(),
          employeeTelegramId: actor.telegramId,
          employeeName,
          note: "Создано вручную в Telegram",
        },
      ],
    })
    .returning({ id: requests.id });

  if (matchedProducts.length > 0) {
    await db.insert(requestItems).values(
      matchedProducts.map((p) => ({
        requestId: created.id,
        productId: p.id,
        productName: p.name,
        categorySlug: p.categorySlug,
        productSlug: p.slug,
      }))
    );
  }

  await db.delete(telegramPendingActions).where(eq(telegramPendingActions.key, key));

  await postNewOrderCard(created.id);
  return { kind: "new_order_ok", requestId: created.id };
}
