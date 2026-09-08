"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logout } from "@/lib/admin-auth-actions";
import { Logo } from "@/components/logo";
import {
  DashboardIcon,
  RequestsIcon,
  ProductsIcon,
  CategoriesIcon,
  LogoutIcon,
  PageIcon,
} from "./icons";

function BackIcon({ className = "h-[18px] w-[18px]" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M19 12H5m0 0 6-6m-6 6 6 6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const NAV_ITEMS = [
  { href: "/admin", label: "Дашборд", icon: DashboardIcon, exact: true },
  { href: "/admin/requests", label: "Заявки", icon: RequestsIcon },
  { href: "/admin/products", label: "Товары", icon: ProductsIcon },
  { href: "/admin/categories", label: "Категории", icon: CategoriesIcon },
  { href: "/admin/pages", label: "Страницы", icon: PageIcon },
];

function SidebarLogo() {
  return (
    <div className="flex flex-col gap-1">
      <Logo size={24} />
      <p className="text-[11px] leading-tight text-navy/40">
        Панель управления
      </p>
    </div>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-1 flex-col gap-1 px-4">
      {NAV_ITEMS.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              active
                ? "bg-navy text-white shadow-sm"
                : "text-navy/60 hover:bg-navy/5 hover:text-navy"
            }`}
          >
            <Icon
              className={`h-[18px] w-[18px] shrink-0 transition ${
                active ? "text-white" : "text-navy/40 group-hover:text-navy/70"
              }`}
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function AccountFooter() {
  return (
    <div className="border-t border-navy/10 px-4 py-4">
      <div className="mb-2 flex items-center gap-2.5 rounded-lg px-3 py-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sage/20 text-xs font-semibold text-sage-dark">
          A
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-navy">
            Administrator
          </p>
          <p className="truncate text-[11px] text-navy/40">Molly Home</p>
        </div>
      </div>
      <Link
        href="/"
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-navy/50 transition hover:bg-navy/5 hover:text-navy"
      >
        <BackIcon />
        Вернуться на сайт
      </Link>
      <form action={logout}>
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-navy/50 transition hover:bg-navy/5 hover:text-navy"
        >
          <LogoutIcon className="h-[18px] w-[18px]" />
          Выйти
        </button>
      </form>
    </div>
  );
}

export function AdminSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-navy/10 bg-white px-4 py-3 md:hidden">
        <SidebarLogo />
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-md p-2 text-navy hover:bg-navy/5"
          aria-label="Открыть меню"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M3 6h18M3 12h18M3 18h18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-navy/40"
            aria-label="Закрыть меню"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-0 flex h-full w-72 max-w-[85%] flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between px-6 py-6">
              <SidebarLogo />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-2 text-navy hover:bg-navy/5"
                aria-label="Закрыть"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M6 6l12 12M18 6L6 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
            <NavLinks onNavigate={() => setOpen(false)} />
            <AccountFooter />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-navy/10 bg-white md:flex">
        <div className="px-6 py-6">
          <SidebarLogo />
        </div>
        <NavLinks />
        <AccountFooter />
      </aside>
    </>
  );
}
