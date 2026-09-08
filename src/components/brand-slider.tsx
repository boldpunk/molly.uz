"use client";

import { useRef } from "react";

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d={direction === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BrandSlider({
  items,
}: {
  items: { name: string; logoUrl: string }[];
}) {
  const trackRef = useRef<HTMLDivElement>(null);

  function scroll(dir: -1 | 1) {
    trackRef.current?.scrollBy({ left: dir * 240, behavior: "smooth" });
  }

  if (items.length === 0) return null;

  return (
    <div className="relative border-y border-navy/10 py-6">
      <button
        type="button"
        aria-label="Назад"
        onClick={() => scroll(-1)}
        className="absolute left-0 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-navy/10 bg-white text-navy/40 shadow-sm transition hover:text-navy"
      >
        <ChevronIcon direction="left" />
      </button>

      <div
        ref={trackRef}
        className="flex items-center gap-10 overflow-x-auto px-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((brand, i) =>
          brand.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={brand.logoUrl}
              alt={brand.name}
              className="h-8 w-auto shrink-0 object-contain opacity-70 grayscale transition hover:opacity-100 hover:grayscale-0"
            />
          ) : (
            <span
              key={i}
              className="shrink-0 font-heading text-xl font-bold tracking-wide text-navy/35"
            >
              {brand.name}
            </span>
          )
        )}
      </div>

      <button
        type="button"
        aria-label="Вперёд"
        onClick={() => scroll(1)}
        className="absolute right-0 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-navy/10 bg-white text-navy/40 shadow-sm transition hover:text-navy"
      >
        <ChevronIcon direction="right" />
      </button>
    </div>
  );
}
