"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { rememberProduct, useRecentProducts, type RecentProduct } from "@/lib/recently-viewed";

/** Records the product being viewed; renders nothing. */
export function TrackProductView({ product }: { product: RecentProduct }) {
  const { slug, categorySlug, name, imageUrl, priceLabel } = product;
  useEffect(() => {
    rememberProduct({ slug, categorySlug, name, imageUrl, priceLabel });
  }, [slug, categorySlug, name, imageUrl, priceLabel]);
  return null;
}

export function RecentlyViewed({
  excludeSlug,
  title = "Вы недавно смотрели",
  className = "",
  contained = false,
}: {
  excludeSlug?: string;
  title?: string;
  className?: string;
  /** Already inside a padded page container — skip the outer gutter. */
  contained?: boolean;
}) {
  const items = useRecentProducts().filter((p) => p.slug !== excludeSlug);
  if (items.length < 2) return null;

  return (
    <section className={`animate-fade-in ${contained ? "" : "mx-auto max-w-7xl px-4 sm:px-6"} ${className}`}>
      <h2 className="font-heading text-xl font-bold tracking-tight text-navy sm:text-2xl">{title}</h2>
      <div className="no-scrollbar -mx-4 mt-5 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6">
        {items.map((p) => (
          <Link
            key={p.slug}
            href={`/catalog/${p.categorySlug}/${p.slug}`}
            className="group w-44 shrink-0 snap-start sm:w-52"
          >
            <span className="relative block aspect-[4/3] overflow-hidden rounded-2xl bg-cream-light ring-1 ring-navy/5">
              {p.imageUrl && (
                <Image
                  src={p.imageUrl}
                  alt={p.name}
                  fill
                  sizes="208px"
                  className="object-cover mix-blend-multiply transition duration-500 group-hover:scale-105"
                />
              )}
            </span>
            <span className="mt-2 block truncate text-sm font-semibold text-navy group-hover:text-clay">{p.name}</span>
            {p.priceLabel && <span className="block truncate text-xs text-navy/55">{p.priceLabel}</span>}
          </Link>
        ))}
      </div>
    </section>
  );
}
