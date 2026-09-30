"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import { Category } from "@/lib/types";
import { useRequestList } from "@/lib/request-list-context";
import { Logo } from "@/components/logo";
import { getCategoryIcon } from "@/components/icons/categories";
import { LocationPicker } from "@/components/location-picker";
import { categoryImage } from "@/lib/category-images";

const PAGES = [
  { href: "/configurator/shkaf", label: "Конфигуратор" },
  { href: "/about", label: "О бренде" },
  { href: "/delivery", label: "Доставка" },
  { href: "/contacts", label: "Контакты" },
];

function Icon({ d, className = "h-5 w-5" }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <path d={d} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const ICONS = {
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm10 3-4-4",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-8 8c1.5-4 5-6 8-6s6.5 2 8 6",
  bag: "M6 7h12l-1 13H7L6 7Zm3 0a3 3 0 1 1 6 0",
  phone:
    "M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1l-2.3 2.2Z",
  menu: "M4 7h16M4 12h16M4 17h10",
  close: "M6 6l12 12M18 6 6 18",
  chevron: "M6 9l6 6 6-6",
  arrow: "M5 12h14m-6-6 6 6-6 6",
};

export function Header({
  categories,
  phone,
  logoSrc,
  logoScale,
}: {
  categories: Category[];
  phone: string;
  logoSrc?: string | null;
  logoScale?: number;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { items } = useRequestList();
  const pathname = usePathname();
  const closeMenuTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const progressRef = useRef<HTMLSpanElement>(null);
  const tel = phone.replace(/[^+\d]/g, "");

  // Past the first few pixels the header tightens up and a thin line along
  // its bottom edge tracks how far down the page the visitor is. The line is
  // written straight to the DOM so scrolling never re-renders the header.
  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 24);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (progressRef.current) {
        progressRef.current.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
      }
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    return () => {
      if (closeMenuTimer.current) clearTimeout(closeMenuTimer.current);
    };
  }, []);

  // Navigating closes whatever menu led there.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setMenuOpen(false);
    setDrawerOpen(false);
  }

  function openMenu() {
    if (closeMenuTimer.current) {
      clearTimeout(closeMenuTimer.current);
      closeMenuTimer.current = null;
    }
    setMenuOpen(true);
  }

  function scheduleCloseMenu() {
    closeMenuTimer.current = setTimeout(() => setMenuOpen(false), 180);
  }

  const catalogActive = pathname.startsWith("/catalog");
  const navLink = (active: boolean) =>
    `relative whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-medium transition-colors duration-200 ${
      active ? "bg-navy text-white" : "text-navy/75 hover:bg-navy/[0.06] hover:text-navy"
    }`;

  return (
    <>
      <header
        className={`sticky top-0 z-50 bg-white/90 backdrop-blur-xl transition-shadow duration-300 ${
          scrolled ? "shadow-lg shadow-navy/[0.06]" : "shadow-[0_1px_0_rgba(24,43,76,0.08)]"
        }`}
      >
        <div
          className={`mx-auto flex max-w-7xl items-center gap-3 px-4 transition-[height] duration-300 md:px-6 ${
            scrolled ? "h-16" : "h-20"
          }`}
        >
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="-ml-1 rounded-full p-2 text-navy transition hover:bg-navy/5 lg:hidden"
            aria-label="Открыть меню"
          >
            <Icon d={ICONS.menu} className="h-6 w-6" />
          </button>

          <Link href="/" aria-label="Molly Home — на главную" className="shrink-0 rounded-lg">
            <Logo width={scrolled ? 150 : 164} src={logoSrc} scale={logoScale} className="transition-[width] duration-300" />
          </Link>

          {/* Desktop nav */}
          <nav className="ml-4 hidden flex-1 items-center gap-0.5 lg:flex xl:ml-6" aria-label="Основное меню">
            <div className="relative" onMouseEnter={openMenu} onMouseLeave={scheduleCloseMenu}>
              <Link
                href="/catalog"
                className={`${navLink(catalogActive)} inline-flex items-center gap-1`}
                aria-expanded={menuOpen}
                onFocus={openMenu}
              >
                Каталог
                <Icon d={ICONS.chevron} className={`h-4 w-4 transition-transform duration-300 ${menuOpen ? "rotate-180" : ""}`} />
              </Link>
              {menuOpen && (
                <div className="absolute left-0 top-full z-50 pt-3">
                  <div className="w-[min(58rem,calc(100vw-3rem))] animate-fade-up rounded-3xl border border-navy/10 bg-white p-5 shadow-2xl shadow-navy/15 [animation-duration:0.35s]">
                    <div className="grid grid-cols-[repeat(5,minmax(0,1fr))_14rem] gap-4">
                      {categories.map((cat) => {
                        const CatIcon = getCategoryIcon(cat.slug);
                        const image = categoryImage(cat);
                        return (
                          <Link key={cat.id} href={`/catalog/${cat.slug}`} className="group flex flex-col gap-2.5">
                            <div className="relative flex aspect-[4/5] items-center justify-center overflow-hidden rounded-2xl bg-cream-light">
                              {image && !cat.isPlaceholder ? (
                                <Image
                                  src={image}
                                  alt=""
                                  fill
                                  sizes="200px"
                                  className="object-cover transition duration-500 group-hover:scale-110"
                                />
                              ) : (
                                <CatIcon className="h-8 w-8 text-navy/30" />
                              )}
                            </div>
                            <span className="text-sm font-semibold text-navy transition group-hover:text-clay">
                              {cat.name}
                            </span>
                          </Link>
                        );
                      })}
                      <Link
                        href="/configurator/shkaf"
                        className="group col-start-6 row-start-1 flex flex-col justify-between rounded-2xl bg-navy p-5 text-white"
                      >
                        <span>
                          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cream/70">
                            Онлайн
                          </span>
                          <span className="mt-2 block font-heading text-lg font-bold leading-tight">
                            Соберите шкаф в конфигураторе
                          </span>
                        </span>
                        <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-cream">
                          Открыть
                          <Icon d={ICONS.arrow} className="h-4 w-4 transition group-hover:translate-x-1" />
                        </span>
                      </Link>
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-navy/10 pt-4 text-sm">
                      <span className="text-navy/55">Изготавливаем мебель по вашим размерам</span>
                      <Link href="/catalog" className="inline-flex items-center gap-1.5 font-semibold text-navy hover:text-clay">
                        Все товары <Icon d={ICONS.arrow} className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {PAGES.map((p) => (
              <Link key={p.href} href={p.href} className={navLink(pathname === p.href)}>
                {p.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1">
            <a
              href={`tel:${tel}`}
              aria-label={`Позвонить: ${phone}`}
              className="mr-1 hidden items-center gap-2 whitespace-nowrap rounded-full p-2.5 text-sm font-semibold text-navy transition hover:bg-navy/5 lg:inline-flex 2xl:px-3"
            >
              <Icon d={ICONS.phone} className="h-5 w-5 text-clay 2xl:h-4 2xl:w-4" />
              <span className="hidden 2xl:inline">{phone}</span>
            </a>
            <Link href="/search" className="rounded-full p-2.5 text-navy transition hover:bg-navy/5" aria-label="Поиск">
              <Icon d={ICONS.search} />
            </Link>
            <Link
              href="/account"
              className="hidden rounded-full p-2.5 text-navy transition hover:bg-navy/5 sm:inline-flex"
              aria-label="Аккаунт"
            >
              <Icon d={ICONS.user} />
            </Link>
            <Link
              href="/request"
              className="relative rounded-full p-2.5 text-navy transition hover:bg-navy/5"
              aria-label={`Заявка${items.length ? `: ${items.length}` : ""}`}
            >
              <Icon d={ICONS.bag} />
              {items.length > 0 && (
                <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 animate-fade-in items-center justify-center rounded-full bg-clay px-1 text-[10px] font-bold text-white">
                  {items.length}
                </span>
              )}
            </Link>
            <Link href="/request" className="btn btn-primary ml-2 hidden whitespace-nowrap px-5 py-2.5 md:inline-flex">
              Бесплатный замер
            </Link>
          </div>
        </div>

        <span
          ref={progressRef}
          aria-hidden
          className="absolute bottom-0 left-0 h-[2px] w-full origin-left scale-x-0 bg-gradient-to-r from-clay to-accent-dark"
        />
      </header>

      {/* Mobile drawer */}
      {drawerOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              className="absolute inset-0 animate-fade-in bg-navy/40 backdrop-blur-sm"
              aria-label="Закрыть меню"
              onClick={() => setDrawerOpen(false)}
            />
            <div className="absolute left-0 top-0 flex h-full w-80 max-w-[88%] animate-drawer flex-col overflow-y-auto rounded-r-3xl bg-white p-6 shadow-xl">
              <div className="mb-6 flex items-center justify-between">
                <Logo width={150} src={logoSrc} scale={logoScale} />
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="rounded-full p-2 text-navy hover:bg-navy/5"
                  aria-label="Закрыть"
                >
                  <Icon d={ICONS.close} />
                </button>
              </div>

              <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-clay">Каталог</p>
              <nav className="mt-3 grid grid-cols-2 gap-2.5">
                {categories.map((cat) => {
                  const image = categoryImage(cat);
                  return (
                    <Link
                      key={cat.id}
                      href={`/catalog/${cat.slug}`}
                      onClick={() => setDrawerOpen(false)}
                      className="group relative flex aspect-[4/3] items-end overflow-hidden rounded-2xl bg-cream-light p-2.5"
                    >
                      {image && !cat.isPlaceholder && (
                        <Image src={image} alt="" fill sizes="160px" className="object-cover" />
                      )}
                      <span className="absolute inset-0 bg-gradient-to-t from-ink/70 to-transparent" />
                      <span className="relative text-xs font-semibold leading-tight text-white">{cat.name}</span>
                    </Link>
                  );
                })}
              </nav>

              <nav className="mt-6 flex flex-col border-t border-navy/10 pt-4">
                {[{ href: "/catalog", label: "Все товары" }, ...PAGES, { href: "/account", label: "Аккаунт" }].map((p) => (
                  <Link
                    key={p.href}
                    href={p.href}
                    onClick={() => setDrawerOpen(false)}
                    className={`flex items-center justify-between rounded-xl px-3 py-3 text-sm font-medium transition ${
                      pathname === p.href ? "bg-navy/5 text-navy" : "text-navy/75 hover:bg-navy/5"
                    }`}
                  >
                    {p.label}
                    <Icon d={ICONS.arrow} className="h-4 w-4 text-navy/30" />
                  </Link>
                ))}
              </nav>

              <div className="mt-auto flex flex-col gap-3 pt-6">
                <div className="px-1 text-xs text-navy/60">
                  <LocationPicker />
                </div>
                <a href={`tel:${tel}`} className="btn btn-outline">
                  <Icon d={ICONS.phone} className="h-4 w-4" />
                  {phone}
                </a>
                <Link href="/request" onClick={() => setDrawerOpen(false)} className="btn btn-primary">
                  Бесплатный замер
                </Link>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
