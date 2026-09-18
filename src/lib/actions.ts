"use server";

import { db } from "@/db";
import { requests, requestItems } from "@/db/schema";
import { RequestItem } from "./types";
import { postNewOrderCard, nextOrderNumber } from "./order-bot";

export async function submitRequest(
  name: string,
  phone: string,
  notes: string,
  items: RequestItem[],
  customerId?: string
) {
  const orderNumber = await nextOrderNumber();

  const [request] = await db
    .insert(requests)
    .values({
      customerId,
      customerName: name,
      customerPhone: phone,
      notes,
      orderNumber,
      statusHistory: [
        { status: "new_order", changedAt: new Date().toISOString() },
      ],
    })
    .returning({ id: requests.id });

  if (items.length > 0) {
    await db.insert(requestItems).values(
      items.map((item) => ({
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

  return { id: request.id, orderNumber };
}
