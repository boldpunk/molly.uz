import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Every query is an HTTPS request to Neon. Without a cap, one that stalls
// holds its page render or webhook open indefinitely; enough of those and the
// whole server runs out of room — pages time out, SSH stops answering, and
// Telegram gives up on the bot. A slow query now fails loudly instead.
const QUERY_TIMEOUT_MS = 15_000;

neonConfig.fetchFunction = (input: RequestInfo | URL, init?: RequestInit) =>
  fetch(input, {
    ...init,
    signal: init?.signal
      ? AbortSignal.any([init.signal, AbortSignal.timeout(QUERY_TIMEOUT_MS)])
      : AbortSignal.timeout(QUERY_TIMEOUT_MS),
  });

const sql = neon(process.env.DATABASE_URL!);

export const db = drizzle(sql, { schema });
