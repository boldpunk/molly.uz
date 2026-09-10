"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { customers } from "@/db/schema";
import {
  createCustomerSessionToken,
  CUSTOMER_SESSION_COOKIE,
} from "./customer-session";
import { normalizePhone, getCustomerByPhone } from "./customers";

async function setSessionCookie(customerId: string) {
  const token = await createCustomerSessionToken(customerId);
  const store = await cookies();
  store.set(CUSTOMER_SESSION_COOKIE.name, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: CUSTOMER_SESSION_COOKIE.maxAge,
    path: "/",
  });
}

export async function registerCustomer(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const phone = normalizePhone(String(formData.get("phone") ?? ""));
  const password = String(formData.get("password") ?? "");

  if (!name || !phone || password.length < 6) {
    redirect("/account?error=invalid&mode=register");
  }

  const existing = await getCustomerByPhone(phone);
  if (existing) {
    redirect("/account?error=phone_taken&mode=register");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [customer] = await db
    .insert(customers)
    .values({ name, phone, passwordHash })
    .returning({ id: customers.id });

  await setSessionCookie(customer.id);
  redirect("/account");
}

export async function loginCustomer(formData: FormData) {
  const phone = normalizePhone(String(formData.get("phone") ?? ""));
  const password = String(formData.get("password") ?? "");

  const customer = await getCustomerByPhone(phone);
  const valid = customer
    ? await bcrypt.compare(password, customer.passwordHash)
    : false;

  if (!customer || !valid) {
    redirect("/account?error=invalid_login&mode=login");
  }

  await setSessionCookie(customer.id);
  redirect("/account");
}

export async function logoutCustomer() {
  const store = await cookies();
  store.delete(CUSTOMER_SESSION_COOKIE.name);
  redirect("/account");
}
