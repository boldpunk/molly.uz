"use server";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { favourites } from "@/db/schema";
import { getCurrentCustomer } from "./customers";
import { isFavourite } from "./data";

export async function toggleFavourite(
  productId: string,
  productPath: string
): Promise<{ isFavourite: boolean } | { error: string }> {
  const customer = await getCurrentCustomer();
  if (!customer) {
    return { error: "not_logged_in" };
  }

  const alreadyFavourite = await isFavourite(customer.id, productId);

  if (alreadyFavourite) {
    await db
      .delete(favourites)
      .where(
        and(
          eq(favourites.customerId, customer.id),
          eq(favourites.productId, productId)
        )
      );
  } else {
    await db
      .insert(favourites)
      .values({ customerId: customer.id, productId })
      .onConflictDoNothing();
  }

  revalidatePath(productPath);
  revalidatePath("/account");
  return { isFavourite: !alreadyFavourite };
}

export async function removeFavourite(productId: string) {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/account");

  await db
    .delete(favourites)
    .where(
      and(
        eq(favourites.customerId, customer.id),
        eq(favourites.productId, productId)
      )
    );

  revalidatePath("/account");
  redirect("/account");
}
