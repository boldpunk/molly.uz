"use server";

import { db } from "@/db";
import { requests, requestItems } from "@/db/schema";
import { RequestItem } from "./types";
import { postNewOrderCard, nextOrderNumber } from "./order-bot";
import { guardRequestSubmission } from "./request-guard";

export type SubmitRequestResult =
  | { ok: true; id: string; orderNumber: string }
  | { ok: false; error: string };

export async function submitRequest(
  name: string,
  phone: string,
  notes: string,
  items: RequestItem[],
  customerId?: string,
  trap?: string
): Promise<SubmitRequestResult> {
  const checked = await guardRequestSubmission({
    name,
    phone,
    notes,
    items,
    trap,
  });
  if (!checked.ok) {
    return { ok: false, error: checked.error };
  }

  // Numbered only once the submission is known to be good, so rejected spam
  // can't eat its way through the order sequence.
  const orderNumber = await nextOrderNumber();

  const [request] = await db
    .insert(requests)
    .values({
      customerId,
      customerName: checked.name,
      customerPhone: checked.phone,
      notes: checked.notes,
      orderNumber,
      statusHistory: [
        { status: "new_order", changedAt: new Date().toISOString() },
      ],
    })
    .returning({ id: requests.id });

  if (checked.items.length > 0) {
    await db.insert(requestItems).values(
      checked.items.map((item) => ({
        requestId: request.id,
        productId: item.productId,
        productName: item.productName,
        categorySlug: item.categorySlug,
        productSlug: item.productSlug,
        hardwareLabel: item.hardwareLabel,
        colourLabel: item.colourLabel,
        widthMetres: item.widthMetres,
        estimate: item.estimate,
      }))
    );
  }

  // Deliberately awaited, not fired via next/server's after(): this app runs
  // as a persistent self-hosted Node server (Dockerfile CMD is `node
  // server.js` from the standalone build), not `next start` or a serverless
  // platform — the self-hosting docs only confirm after() support under
  // `next start`. Every request created since the last deploy that used
  // after() here ended up with no telegram_message_id and zero related log
  // output, meaning the callback silently never ran under this runtime.
  // Awaiting directly costs a few hundred ms on submit but guarantees the
  // card is posted (or the failure is actually logged) before we return.
  try {
    await postNewOrderCard(request.id);
  } catch (err) {
    console.error("Telegram order card post failed", err);
  }

  return { ok: true, id: request.id, orderNumber };
}
