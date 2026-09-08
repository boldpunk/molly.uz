import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  requests,
  requestItems,
  employees,
  orderCounters,
  telegramPendingActions,
  customers,
  products,
  categories,
} from "@/db/schema";
import type { StatusHistoryEntry } from "@/db/schema";
import { RequestStatus } from "./types";
import {
  buildOrderCardText,
  buildOrderCardKeyboard,
  backTarget,
  sendTelegramMessage,
  editTelegramMessage,
  getStaffChatId,
  isStaffNotifyConfigured,
  notifyCustomerStatusChange,
} from "./telegram";

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

async function nextOrderNumber(): Promise<string> {
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

export async function postNewOrderCard(requestId: string): Promise<void> {
  if (!isStaffNotifyConfigured()) return;
  const data = await loadOrderCard(requestId);
  if (!data) return;

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
    requestId,
    data.request.status as RequestStatus,
    Boolean(data.request.depositAmount)
  );

  const sent = await sendTelegramMessage(getStaffChatId()!, text, {
    replyMarkup: keyboard,
  });
  if (sent) {
    await db
      .update(requests)
      .set({ telegramMessageId: String(sent.message_id) })
      .where(eq(requests.id, requestId));
  }
}

export async function refreshOrderCard(requestId: string): Promise<void> {
  if (!isStaffNotifyConfigured()) return;
  const data = await loadOrderCard(requestId);
  if (!data || !data.request.telegramMessageId) return;

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
    requestId,
    data.request.status as RequestStatus,
    Boolean(data.request.depositAmount)
  );

  await editTelegramMessage(
    getStaffChatId()!,
    data.request.telegramMessageId,
    text,
    keyboard
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
  requestId: string,
  promptKind: "amount_deposit" | "amount_paid_full",
  actor: Actor
): Promise<void> {
  const chatId = getStaffChatId();
  if (!chatId) return;
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

  const [created] = await db
    .insert(requests)
    .values({
      customerName: name,
      customerPhone: phone,
      notes,
      source,
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
