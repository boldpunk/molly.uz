const BOT_USERNAME = "mollyhomeuzbot";

// Matches the p_<digits> payload the webhook's /start handler parses in
// src/app/api/telegram/webhook/route.ts.
export function buildStatusDeepLink(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return `https://t.me/${BOT_USERNAME}?start=p_${digits}`;
}
