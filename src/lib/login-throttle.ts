import { headers } from "next/headers";

// Slows down password guessing on the admin and customer logins (spec 9.4).
// After MAX_FAILURES wrong passwords within WINDOW_MS, from one address or
// against one account, further attempts are refused until the window
// passes. One container, so a Map is the whole store; a deploy resets it,
// which only ever loosens the limit.

const MAX_FAILURES = 5;
const WINDOW_MS = 15 * 60 * 1000;

const failures = new Map<string, number[]>();

function recent(key: string, now: number): number[] {
  const list = (failures.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (list.length) failures.set(key, list);
  else failures.delete(key);
  return list;
}

export async function loginKeys(scope: string, account: string): Promise<string[]> {
  const store = await headers();
  const ip = store.get("x-forwarded-for")?.split(",")[0]?.trim() || store.get("x-real-ip") || "unknown";
  return [`${scope}:ip:${ip}`, `${scope}:acct:${account.trim().toLowerCase()}`];
}

export function isLocked(keys: string[]): boolean {
  const now = Date.now();
  return keys.some((k) => recent(k, now).length >= MAX_FAILURES);
}

export function recordFailure(keys: string[]): void {
  const now = Date.now();
  for (const k of keys) failures.set(k, [...recent(k, now), now]);
}

export function clearFailures(keys: string[]): void {
  // Only the account key: a correct password proves the account, but says
  // nothing about other guesses coming from the same address.
  failures.delete(keys[1]);
}
