"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyPassword } from "./auth";
import { createSessionToken, SESSION_COOKIE } from "./session";

export async function login(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/admin");

  const valid = await verifyPassword(password);
  if (!valid) {
    redirect(`/admin/login?error=1&next=${encodeURIComponent(next)}`);
  }

  const token = await createSessionToken();
  const store = await cookies();
  store.set(SESSION_COOKIE.name, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_COOKIE.maxAge,
    path: "/",
  });

  redirect(next.startsWith("/admin") ? next : "/admin");
}

export async function logout() {
  const store = await cookies();
  store.delete(SESSION_COOKIE.name);
  redirect("/admin/login");
}
