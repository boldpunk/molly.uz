"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import { Category } from "@/lib/types";
import { useRequestList } from "@/lib/request-list-context";
import { Logo } from "@/components/logo";
import { getCategoryIcon } from "@/components/icons/categories";
import { LocationPicker } from "@/components/location-picker";

export function Header({
  categories,
  phone,
}: {
  categories: Category[];
  phone: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { items } = useRequestList();
  const pathname = usePathname();

  return (
    <>
    <header className="sticky top-0 z-50 border-b border-navy/10 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      {/* Utility bar — hidden on mobile */}
      <div className="hidden border-b border-navy/10 text-xs text-navy/70 md:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-2">
          <LocationPicker />
          <div className="flex items-center gap-4">
            <a
              href={`tel:${phone.replace(/[^+\d]/g, "")}`}
              className="hover:text-navy"
            >
              {phone}
            </a>
            <button
              type="button"
              className="font-medium hover:text-navy"
              aria-label="Переключить язык"
            >
              RU / UZ
            </button>
          </div>
        </div>
      </div>

      {/* Main bar */}
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 md:px-6">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="rounded-md p-2 text-navy hover:bg-navy/5 md:hidden"
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

        <Link href="/" aria-label="Molly Home">
          <Logo size={26} />
        </Link>

        {/* Desktop nav */}
        <nav className="relative ml-6 hidden flex-1 items-center gap-6 md:flex">
          <div
            onMouseEnter={() => setMenuOpen(true)}
            onMouseLeave={() => setMenuOpen(false)}
          >
            <button
              type="button"
              className={`border-b-2 py-1 text-sm font-medium transition-colors ${
                pathname === "/catalog"
                  ? "border-sage-dark text-sage-dark"
                  : "border-transparent text-navy hover:border-sage-dark/40 hover:text-sage-dark"
              }`}
            >
              Каталог
            </button>
            {menuOpen && (
              <div className="absolute left-0 top-full z-50 mt-2 w-full rounded-lg border border-navy/10 bg-white p-6 shadow-lg">
                <div className="grid grid-cols-5 gap-4">
                  {categories.map((cat) => {
                    const Icon = getCategoryIcon(cat.slug);
                    return (
                      <Link
                        key={cat.id}
                        href={`/catalog/${cat.slug}`}
                        className="group flex flex-col gap-2"
                      >
                        <div className="flex aspect-square items-center justify-center rounded-md border border-navy/10 bg-navy/[0.03] transition group-hover:bg-sage/10">
                          <Icon className="h-8 w-8 text-navy/40 transition group-hover:text-sage-dark" />
                        </div>
                        <span className="text-sm font-medium text-navy group-hover:text-sage-dark">
                          {cat.name}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          {categories.slice(0, 4).map((cat) => {
            const isActive = pathname === `/catalog/${cat.slug}`;
            return (
              <Link
                key={cat.id}
                href={`/catalog/${cat.slug}`}
                className={`border-b-2 py-1 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-sage-dark text-sage-dark"
                    : "border-transparent text-navy/70 hover:border-sage-dark/40 hover:text-navy"
                }`}
              >
                {cat.name}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <Link
            href="/search"
            className="rounded-md p-2 text-navy hover:bg-navy/5"
            aria-label="Поиск"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle
                cx="11"
                cy="11"
                r="7"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M21 21l-4-4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </Link>
          <Link
            href="/account"
            className="hidden rounded-md p-2 text-navy hover:bg-navy/5 md:inline-flex"
            aria-label="Аккаунт"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle
                cx="12"
                cy="8"
                r="4"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M4 20c1.5-4 5-6 8-6s6.5 2 8 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </Link>
          <Link
            href="/request"
            className="relative rounded-md p-2 text-navy hover:bg-navy/5"
            aria-label="Заявка на замер"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M6 6h15l-1.5 9h-12z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <path d="M6 6L4 3H2" stroke="currentColor" strokeWidth="2" />
              <circle cx="9" cy="20" r="1.5" fill="currentColor" />
              <circle cx="17" cy="20" r="1.5" fill="currentColor" />
            </svg>
            {items.length > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-sage-dark text-[10px] font-semibold text-white">
                {items.length}
              </span>
            )}
          </Link>
        </div>
      </div>

    </header>

    {/* Mobile drawer */}
    {drawerOpen &&
      createPortal(
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-navy/40"
            aria-label="Закрыть меню"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-72 max-w-[85%] overflow-y-auto bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <Logo size={24} />
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
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
            <nav className="flex flex-col gap-1">
              {categories.map((cat) => {
                const Icon = getCategoryIcon(cat.slug);
                return (
                  <Link
                    key={cat.id}
                    href={`/catalog/${cat.slug}`}
                    onClick={() => setDrawerOpen(false)}
                    className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-navy hover:bg-navy/5"
                  >
                    <Icon className="h-[18px] w-[18px] text-navy/40" />
                    {cat.name}
                  </Link>
                );
              })}
              <div className="my-3 border-t border-navy/10" />
              <Link
                href="/request"
                onClick={() => setDrawerOpen(false)}
                className="rounded-md px-3 py-2.5 text-sm text-navy/70 hover:bg-navy/5"
              >
                Заявка на замер
              </Link>
              <Link
                href="/account"
                onClick={() => setDrawerOpen(false)}
                className="rounded-md px-3 py-2.5 text-sm text-navy/70 hover:bg-navy/5"
              >
                Аккаунт
              </Link>
              <Link
                href="/about"
                onClick={() => setDrawerOpen(false)}
                className="rounded-md px-3 py-2.5 text-sm text-navy/70 hover:bg-navy/5"
              >
                О бренде
              </Link>
              <Link
                href="/delivery"
                onClick={() => setDrawerOpen(false)}
                className="rounded-md px-3 py-2.5 text-sm text-navy/70 hover:bg-navy/5"
              >
                Доставка и оплата
              </Link>
              <Link
                href="/contacts"
                onClick={() => setDrawerOpen(false)}
                className="rounded-md px-3 py-2.5 text-sm text-navy/70 hover:bg-navy/5"
              >
                Контакты
              </Link>
            </nav>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
