import { headers } from "next/headers";
import type { RequestItem } from "./types";

// The public request form posts straight into the sales pipeline: every
// accepted submission writes a row, consumes an order number and pushes a card
// into the staff Telegram group. submitRequest is a server action, so it is
// reachable without the form — every limit here has to hold on the server.

const NAME_MAX = 80;
const NOTES_MAX = 2000;
const ITEMS_MAX = 50;
const PHONE_DIGITS_MIN = 9;
const PHONE_DIGITS_MAX = 15;

const PER_IP_LIMIT = 5;
const PER_IP_WINDOW_MS = 10 * 60 * 1000;
const PER_PHONE_LIMIT = 3;
const PER_PHONE_WINDOW_MS = 60 * 60 * 1000;

export interface GuardFailure {
  ok: false;
  error: string;
}

export interface GuardSuccess {
  ok: true;
  name: string;
  phone: string;
  notes: string;
  items: RequestItem[];
}

function digitsOf(value: string): string {
  return value.replace(/\D/g, "");
}

// One process per container, so a plain Map is the whole store. It resets on
// deploy, which only ever loosens the limit — acceptable for slowing down
// spam, and far better than having no ceiling at all.
const hits = new Map<string, number[]>();

function tooMany(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((at) => now - at < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return true;
  }
  recent.push(now);
  hits.set(key, recent);

  // Opportunistic cleanup so the map can't grow without bound.
  if (hits.size > 5000) {
    for (const [k, times] of hits) {
      if (times.every((at) => now - at > PER_PHONE_WINDOW_MS)) hits.delete(k);
    }
  }
  return false;
}

async function clientIp(): Promise<string> {
  const store = await headers();
  const forwarded = store.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return store.get("x-real-ip") ?? "unknown";
}

export async function guardRequestSubmission(input: {
  name: string;
  phone: string;
  notes: string;
  items: RequestItem[];
  /** Hidden field no human fills in; bots fill everything. */
  trap?: string;
}): Promise<GuardSuccess | GuardFailure> {
  if (input.trap && input.trap.trim()) {
    return { ok: false, error: "Заявка не отправлена." };
  }

  const name = input.name.trim().replace(/\s+/g, " ");
  if (name.length < 2) {
    return { ok: false, error: "Укажите имя — хотя бы два символа." };
  }
  if (name.length > NAME_MAX) {
    return { ok: false, error: "Имя слишком длинное." };
  }

  const phoneDigits = digitsOf(input.phone);
  if (
    phoneDigits.length < PHONE_DIGITS_MIN ||
    phoneDigits.length > PHONE_DIGITS_MAX
  ) {
    return { ok: false, error: "Проверьте номер телефона." };
  }

  const notes = input.notes.trim();
  if (notes.length > NOTES_MAX) {
    return { ok: false, error: "Комментарий слишком длинный." };
  }

  if (input.items.length > ITEMS_MAX) {
    return { ok: false, error: "Слишком много позиций в заявке." };
  }

  const ip = await clientIp();
  if (tooMany(`ip:${ip}`, PER_IP_LIMIT, PER_IP_WINDOW_MS)) {
    return {
      ok: false,
      error: "Слишком много заявок подряд. Попробуйте через несколько минут.",
    };
  }
  if (tooMany(`phone:${phoneDigits}`, PER_PHONE_LIMIT, PER_PHONE_WINDOW_MS)) {
    return {
      ok: false,
      error:
        "С этого номера уже есть заявки. Мы скоро свяжемся — или позвоните нам напрямую.",
    };
  }

  return {
    ok: true,
    name,
    phone: input.phone.trim().slice(0, 32),
    notes,
    // Item fields reach the staff card and the proposal, so they are capped
    // here too rather than trusted at whatever length the client sent.
    items: input.items.map((item) => ({
      ...item,
      productName: String(item.productName ?? "").slice(0, 200),
      categorySlug: String(item.categorySlug ?? "").slice(0, 120),
      productSlug: String(item.productSlug ?? "").slice(0, 120),
      hardwareLabel: item.hardwareLabel
        ? String(item.hardwareLabel).slice(0, 200)
        : item.hardwareLabel,
      colourLabel: item.colourLabel
        ? String(item.colourLabel).slice(0, 400)
        : item.colourLabel,
    })),
  };
}
