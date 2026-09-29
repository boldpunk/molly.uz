import dns from "node:dns";

// Node resolves hosts in whatever order DNS returns them, often IPv6 first.
// Inside a container with no IPv6 route those attempts stall until they
// time out before falling back — every outbound call to Telegram and Neon
// paying that cost. Preferring IPv4 avoids the stall entirely.
dns.setDefaultResultOrder("ipv4first");

// Keep the bot's command menu (/start, /menu) in step with the code. One
// call per server start; a failure only means the old menu stays for now.
if (process.env.TELEGRAM_BOT_TOKEN) {
  import("./lib/telegram")
    .then((m) => m.setBotCommands())
    .catch((err) => console.error("Telegram command menu update failed", err));
}
