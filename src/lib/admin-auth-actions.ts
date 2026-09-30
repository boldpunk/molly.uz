"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyAdminCredentials } from "./auth";
import { createSessionToken, SESSION_COOKIE } from "./session";
import { clearFailures, isLocked, loginKeys, recordFailure } from "./login-throttle";

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/admin");

  const keys = await loginKeys("admin", email);
  if (isLocked(keys)) {
    redirect(`/admin/login?error=locked&next=${encodeURIComponent(next)}`);
  }

  const user = await verifyAdminCredentials(email, password);
  if (!user) {
    recordFailure(keys);
    redirect(`/admin/login?error=1&next=${encodeURIComponent(next)}`);
  }
  clearFailures(keys);

  const token = await createSessionToken(user.id, user.role);
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
