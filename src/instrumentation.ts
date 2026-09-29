import type { Instrumentation } from "next";

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  // Node resolves hosts in whatever order DNS returns them, often IPv6 first.
  // Inside a container with no IPv6 route those attempts stall until they
  // time out before falling back — every outbound call to Telegram and Neon
  // paying that cost. Preferring IPv4 avoids the stall entirely.
  const dns = await import("node:dns");
  dns.setDefaultResultOrder("ipv4first");
}

// Surfaces server-side failures in the container log with the route they
// happened on, so a production problem is visible without guessing.
export const onRequestError: Instrumentation.onRequestError = async (
  err,
  request,
  context
) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(
    `[request-error] ${request.method} ${request.path} (${context.routeType}): ${message}`
  );
};
