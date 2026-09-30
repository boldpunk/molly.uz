"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logout } from "@/lib/admin-auth-actions";
import type { CurrentAdmin } from "@/lib/admin-users";
import { ADMIN_ROLE_LABELS } from "@/lib/admin-role-labels";
import { Logo } from "@/components/logo";
import {
  DashboardIcon,
  RequestsIcon,
  ProductsIcon,
  CategoriesIcon,
  LogoutIcon,
  PageIcon,
  UsersIcon,
  ConfiguratorIcon,
  EmployeesIcon,
  ProposalsIcon,
  BrandIcon,
  CustomersIcon,
  ExternalIcon,
} from "./icons";

type Role = string;
interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: Role[];
  exact?: boolean;
  badge?: "newRequests";
}

const SALES: Role[] = ["administrator", "sales_manager"];
const CATALOG: Role[] = ["administrator", "catalog_manager"];

const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: "Продажи",
    items: [
      { href: "/admin", label: "Дашборд", icon: DashboardIcon, exact: true, roles: SALES },
      { href: "/admin/requests", label: "Заявки", icon: RequestsIcon, roles: SALES, badge: "newRequests" },
      { href: "/admin/customers", label: "Клиенты", icon: CustomersIcon, roles: SALES },
      { href: "/admin/proposals", label: "КП", icon: ProposalsIcon, roles: SALES },
    ],
  },
  {
    title: "Каталог",
    items: [
      { href: "/admin/products", label: "Товары", icon: ProductsIcon, roles: CATALOG },
      { href: "/admin/categories", label: "Категории", icon: CategoriesIcon, roles: CATALOG },
      { href: "/admin/configurator", label: "Конфигуратор", icon: ConfiguratorIcon, roles: CATALOG },
    ],
  },
  {
    title: "Сайт",
    items: [
      { href: "/admin/pages", label: "Страницы", icon: PageIcon, roles: ["administrator", "content_editor"] },
      { href: "/admin/brand", label: "Бренд", icon: BrandIcon, roles: ["administrator"] },
    ],
  },
  {
    title: "Команда",
    items: [
      { href: "/admin/employees", label: "Сотрудники", icon: EmployeesIcon, roles: ["administrator"] },
      { href: "/admin/users", label: "Пользователи", icon: UsersIcon, roles: ["administrator"] },
    ],
  },
];

function NavLinks({
  role,
  newRequests,
  onNavigate,
}: {
  role: string;
  newRequests: number;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 pb-4">
      {NAV_GROUPS.map((group) => {
        const items = group.items.filter((item) => item.roles.includes(role));
        if (items.length === 0) return null;
        return (
          <div key={group.title}>
            <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-cream/35">
              {group.title}
            </p>
            <div className="flex flex-col gap-0.5">
              {items.map((item) => {
                const active = item.exact
                  ? pathname === item.href
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;
                const count = item.badge === "newRequests" ? newRequests : 0;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                      active ? "bg-white/10 text-white" : "text-cream/65 hover:bg-white/[0.06] hover:text-white"
                    }`}
                  >
                    {active && <span className="absolute -left-3 top-2 bottom-2 w-1 rounded-r-full bg-clay" />}
                    <Icon
                      className={`h-[18px] w-[18px] shrink-0 transition ${
                        active ? "text-clay" : "text-cream/40 group-hover:text-cream/80"
                      }`}
                    />
                    <span className="flex-1">{item.label}</span>
                    {count > 0 && (
                      <span className="rounded-full bg-clay px-2 py-0.5 text-[11px] font-bold text-white">{count}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );
}

function AccountFooter({ admin }: { admin: CurrentAdmin }) {
  const initial = admin.name.trim().charAt(0).toUpperCase() || "A";
  const roleLabel = ADMIN_ROLE_LABELS[admin.role] ?? admin.role;
  return (
    <div className="border-t border-white/10 p-3">
      <div className="flex items-center gap-3 rounded-xl bg-white/[0.06] px-3 py-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cream text-sm font-bold text-navy">
          {initial}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{admin.name}</p>
          <p className="truncate text-[11px] text-cream/50">{roleLabel}</p>
        </div>
        <form action={logout}>
          <button
            type="submit"
            title="Выйти"
            aria-label="Выйти"
            className="rounded-lg p-2 text-cream/50 transition hover:bg-white/10 hover:text-white"
          >
            <LogoutIcon className="h-[18px] w-[18px]" />
          </button>
        </form>
      </div>
      <Link
        href="/"
        target="_blank"
        className="mt-2 flex items-center justify-between rounded-xl px-3 py-2 text-sm text-cream/55 transition hover:bg-white/[0.06] hover:text-white"
      >
        Открыть сайт
        <ExternalIcon className="h-4 w-4" />
      </Link>
    </div>
  );
}

export function AdminSidebar({
  admin,
  logoSrc,
  logoScale,
  newRequests = 0,
}: {
  admin: CurrentAdmin;
  /** The reversed (cream) logo — the sidebar is navy. */
  logoSrc?: string | null;
  logoScale?: number;
  newRequests?: number;
}) {
  const [open, setOpen] = useState(false);
  const logo = (
    <Link href="/admin" className="flex flex-col gap-1.5" onClick={() => setOpen(false)}>
      <Logo width={150} tone="cream" src={logoSrc} scale={logoScale} />
      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cream/40">Панель управления</span>
    </Link>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 flex items-center justify-between bg-navy px-4 py-3 md:hidden">
        {logo}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="relative rounded-lg p-2 text-cream hover:bg-white/10"
          aria-label="Открыть меню"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M4 7h16M4 12h16M4 17h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          {newRequests > 0 && <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-clay" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 animate-fade-in bg-ink/50 backdrop-blur-sm"
            aria-label="Закрыть меню"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-0 flex h-full w-72 max-w-[85%] animate-drawer flex-col bg-navy shadow-xl">
            <div className="flex items-center justify-between px-6 py-6">
              {logo}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 text-cream hover:bg-white/10"
                aria-label="Закрыть"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <NavLinks role={admin.role} newRequests={newRequests} onNavigate={() => setOpen(false)} />
            <AccountFooter admin={admin} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="relative hidden w-64 shrink-0 flex-col overflow-hidden bg-navy md:sticky md:top-0 md:flex md:h-screen">
        <div aria-hidden className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-clay/15 blur-3xl" />
        <div className="relative px-6 pb-6 pt-7">{logo}</div>
        <NavLinks role={admin.role} newRequests={newRequests} />
        <AccountFooter admin={admin} />
      </aside>
    </>
  );
}
