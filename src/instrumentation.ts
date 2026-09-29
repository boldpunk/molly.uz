import type { Instrumentation } from "next";

export async function register() {
  // Kept in its own module so the Edge build never sees Node-only imports.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./instrumentation-node");
  }
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
