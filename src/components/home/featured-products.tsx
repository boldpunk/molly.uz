"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Category, Product } from "@/lib/types";

// Tabs filter the popular models by category on the spot; the cards
// themselves are rendered on the server and passed in, so only the
// filtering lives on the client.
export function FeaturedProducts({
  products,
  categories,
  cards,
}: {
  products: Product[];
  categories: Category[];
  cards: Record<string, React.ReactNode>;
}) {
  const [active, setActive] = useState<string>("all");

  const tabs = useMemo(() => {
    const present = new Set(products.map((p) => p.categorySlug));
    return categories.filter((c) => present.has(c.slug));
  }, [products, categories]);

  const visible =
    active === "all" ? products : products.filter((p) => p.categorySlug === active);

  return (
    <div>
      {tabs.length > 1 && (
        <div className="no-scrollbar -mx-6 flex gap-2 overflow-x-auto px-6 pb-1">
          {[{ slug: "all", name: "Все" }, ...tabs].map((t) => (
            <button
              key={t.slug}
              type="button"
              onClick={() => setActive(t.slug)}
              aria-pressed={active === t.slug}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition ${
                active === t.slug
                  ? "border-navy bg-navy text-white shadow-md shadow-navy/20"
                  : "border-navy/15 text-navy/70 hover:border-navy/40 hover:text-navy"
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>
      )}

      <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
        {visible.map((p, i) => (
          <div
            key={`${active}-${p.id}`}
            className="animate-fade-up"
            style={{ animationDelay: `${Math.min(i, 7) * 60}ms` }}
          >
            {cards[p.id]}
          </div>
        ))}
      </div>

      {active !== "all" && (
        <div className="mt-10 flex justify-center">
          <Link href={`/catalog/${active}`} className="btn btn-outline">
            Все модели раздела
          </Link>
        </div>
      )}
    </div>
  );
}
