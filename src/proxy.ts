import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/session";

const ROLE_HOME: Record<string, string> = {
  administrator: "/admin",
  sales_manager: "/admin",
  catalog_manager: "/admin/products",
  content_editor: "/admin/pages",
};

function isAllowed(role: string, pathname: string): boolean {
  if (role === "administrator") return true;
  if (pathname === "/admin") {
    return role === "sales_manager";
  }
  if (pathname.startsWith("/admin/requests")) {
    return role === "sales_manager";
  }
  if (
    pathname.startsWith("/admin/products") ||
    pathname.startsWith("/admin/categories")
  ) {
    return role === "catalog_manager";
  }
  if (pathname.startsWith("/admin/pages")) {
    return role === "content_editor";
  }
  if (pathname.startsWith("/admin/users")) {
    return false;
  }
  return false;
}

export async function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE.name)?.value;
  const session = await verifySessionToken(token);

  if (!session) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!isAllowed(session.role, request.nextUrl.pathname)) {
    const home = ROLE_HOME[session.role] ?? "/admin/login";
    return NextResponse.redirect(new URL(home, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/((?!login).*)"],
};
