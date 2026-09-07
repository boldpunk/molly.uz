"use server";

import { db } from "@/db";
import { requests, requestItems } from "@/db/schema";
import { RequestItem } from "./types";

export async function submitRequest(
  name: string,
  phone: string,
  notes: string,
  items: RequestItem[],
  customerId?: string
) {
  const [request] = await db
    .insert(requests)
    .values({
      customerId,
      customerName: name,
      customerPhone: phone,
      notes,
      statusHistory: [{ status: "new", changedAt: new Date().toISOString() }],
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

  return { id: request.id };
}
