import { desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { customers, customerNotes, requests, requestItems } from "@/db/schema";
import type { RequestStatus } from "./types";

// A customer here is a person, not an account: anyone who registered on the
// site or left a request is grouped by the digits of their phone number, so
// repeat requests and a later sign-up all land on the same card.

export function phoneDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}

export interface CustomerSummary {
  digits: string;
  name: string;
  phone: string;
  registered: boolean;
  telegram: boolean;
  requestCount: number;
  lastStatus: RequestStatus | null;
  lastActivity: Date;
  firstSeen: Date;
}

export async function getCustomerList(query = ""): Promise<CustomerSummary[]> {
  const [accounts, reqs] = await Promise.all([
    db.select().from(customers),
    db
      .select({
        name: requests.customerName,
        phone: requests.customerPhone,
        status: requests.status,
        createdAt: requests.createdAt,
      })
      .from(requests)
      .orderBy(desc(requests.createdAt)),
  ]);

  const map = new Map<string, CustomerSummary>();
  for (const a of accounts) {
    const digits = phoneDigits(a.phone);
    map.set(digits, {
      digits,
      name: a.name,
      phone: a.phone,
      registered: true,
      telegram: Boolean(a.telegramId),
      requestCount: 0,
      lastStatus: null,
      lastActivity: a.createdAt,
      firstSeen: a.createdAt,
    });
  }
  // Requests come newest first, so the first one seen per phone is the latest.
  for (const r of reqs) {
    const digits = phoneDigits(r.phone);
    const existing = map.get(digits);
    if (existing) {
      if (existing.requestCount === 0) {
        existing.lastStatus = r.status;
        if (r.createdAt > existing.lastActivity) existing.lastActivity = r.createdAt;
      }
      if (r.createdAt < existing.firstSeen) existing.firstSeen = r.createdAt;
      existing.requestCount++;
    } else {
      map.set(digits, {
        digits,
        name: r.name,
        phone: r.phone,
        registered: false,
        telegram: false,
        requestCount: 1,
        lastStatus: r.status,
        lastActivity: r.createdAt,
        firstSeen: r.createdAt,
      });
    }
  }

  const q = query.trim().toLowerCase();
  const qDigits = phoneDigits(q);
  return [...map.values()]
    .filter((c) => !q || c.name.toLowerCase().includes(q) || (qDigits.length >= 3 && c.digits.includes(qDigits)))
    .sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
}

export async function getCustomerDetail(digits: string) {
  const [account] = await db
    .select()
    .from(customers)
    .where(sql`regexp_replace(${customers.phone}, '[^0-9]', '', 'g') = ${digits}`)
    .limit(1);
  const reqs = await db
    .select()
    .from(requests)
    .where(sql`regexp_replace(${requests.customerPhone}, '[^0-9]', '', 'g') = ${digits}`)
    .orderBy(desc(requests.createdAt));
  if (!account && reqs.length === 0) return null;

  const items = reqs.length
    ? await db
        .select()
        .from(requestItems)
        .where(inArray(requestItems.requestId, reqs.map((r) => r.id)))
    : [];
  const [note] = await db.select().from(customerNotes).where(eq(customerNotes.phoneDigits, digits)).limit(1);

  return {
    digits,
    name: account?.name ?? reqs[0].customerName,
    phone: account?.phone ?? reqs[0].customerPhone,
    account,
    requests: reqs.map((r) => ({ ...r, items: items.filter((i) => i.requestId === r.id) })),
    notes: note?.notes ?? "",
    notesUpdatedAt: note?.updatedAt ?? null,
  };
}
