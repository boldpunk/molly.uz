import dns from "node:dns";

// Node resolves hosts in whatever order DNS returns them, often IPv6 first.
// Inside a container with no IPv6 route those attempts stall until they
// time out before falling back — every outbound call to Telegram and Neon
// paying that cost. Preferring IPv4 avoids the stall entirely.
dns.setDefaultResultOrder("ipv4first");
