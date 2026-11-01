"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface Suggestion {
  name: string;
  href: string;
  image: string | null;
  category: string;
  price: string;
}

const POPULAR = [
  { label: "Кухни", href: "/catalog/kuhonnaya-mebel" },
  { label: "Диваны", href: "/catalog/myagkaya-mebel" },
  { label: "Шкафы", href: "/catalog/garderoby" },
  { label: "Кровати", href: "/catalog/krovati" },
  { label: "Собрать шкаф", href: "/configurator/shkaf" },
  { label: "Подбор за минуту", href: "/podbor" },
];

/**
 * Search that answers while you type: a panel over the page with matching
 * models, their photo and price. Enter still opens the full results page.
 */
export function SearchOverlay({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ products: Suggestion[]; categories: { name: string; href: string }[] }>({
    products: [],
    categories: [],
  });
  const [loading, setLoading] = useState(false);
  const term = query.trim();

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  useEffect(() => {
    if (term.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: controller.signal });
        if (res.ok) setResults(await res.json());
      } catch {
        // Aborted by the next keystroke, or offline — keep what's shown.
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 180);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [term]);

  const showResults = term.length >= 2;
  const empty = showResults && !loading && results.products.length === 0 && results.categories.length === 0;

  return createPortal(
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Поиск">
      <button type="button" aria-label="Закрыть поиск" onClick={onClose} className="absolute inset-0 animate-fade-in bg-ink/40 backdrop-blur-sm" />
      <div className="relative mx-auto mt-0 max-w-3xl animate-fade-up bg-white shadow-2xl shadow-navy/20 [animation-duration:0.35s] sm:mt-6 sm:rounded-[1.75rem]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!term) return;
            onClose();
            router.push(`/search?q=${encodeURIComponent(term)}`);
          }}
          className="flex items-center gap-3 border-b border-navy/10 px-5 py-4"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 shrink-0 text-navy/40" aria-hidden>
            <path d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm10 3-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Кухня, диван, шкаф, цвет…"
            aria-label="Что ищем"
            className="w-full bg-transparent py-1 text-base text-navy outline-none placeholder:text-navy/35"
          />
          {loading && <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-navy/15 border-t-clay" aria-hidden />}
          <button type="button" onClick={onClose} className="shrink-0 rounded-full px-3 py-1.5 text-sm font-medium text-navy/55 hover:bg-navy/5 hover:text-navy">
            Закрыть
          </button>
        </form>

        <div className="max-h-[70vh] overflow-y-auto p-3 sm:p-4">
          {!showResults && (
            <div className="p-2">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-navy/40">Часто ищут</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {POPULAR.map((p) => (
                  <Link
                    key={p.href}
                    href={p.href}
                    onClick={onClose}
                    className="rounded-full bg-cream-light px-4 py-2 text-sm font-medium text-navy transition hover:bg-navy hover:text-white"
                  >
                    {p.label}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {showResults && results.categories.length > 0 && (
            <div className="flex flex-wrap gap-2 px-2 pb-3">
              {results.categories.map((c) => (
                <Link key={c.href} href={c.href} onClick={onClose} className="rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white">
                  Раздел «{c.name}» →
                </Link>
              ))}
            </div>
          )}

          {showResults && results.products.length > 0 && (
            <ul className="flex flex-col gap-1">
              {results.products.map((p) => (
                <li key={p.href}>
                  <Link
                    href={p.href}
                    onClick={onClose}
                    className="group flex items-center gap-4 rounded-2xl p-2 transition hover:bg-cream-light"
                  >
                    <span className="relative h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-cream-light">
                      {p.image && (
                        <Image src={p.image} alt="" fill sizes="160px" className="object-cover mix-blend-multiply" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-navy group-hover:text-clay">{p.name}</span>
                      <span className="block truncate text-xs text-navy/50">{p.category}</span>
                      <span className="mt-0.5 block text-sm font-bold text-navy">{p.price}</span>
                    </span>
                    <span aria-hidden className="pr-2 text-navy/30 transition group-hover:translate-x-1 group-hover:text-navy">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {empty && (
            <div className="px-2 py-6 text-center">
              <p className="font-semibold text-navy">Ничего не нашли по «{term}»</p>
              <p className="mt-1 text-sm text-navy/55">Мебель делаем и по вашему проекту — оставьте заявку, и мы рассчитаем.</p>
              <Link href="/request" onClick={onClose} className="btn btn-primary mt-4">
                Оставить заявку
              </Link>
            </div>
          )}

          {showResults && results.products.length > 0 && (
            <Link
              href={`/search?q=${encodeURIComponent(term)}`}
              onClick={onClose}
              className="mt-2 block rounded-2xl px-3 py-3 text-center text-sm font-semibold text-navy/60 transition hover:bg-navy/5 hover:text-navy"
            >
              Все результаты →
            </Link>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
