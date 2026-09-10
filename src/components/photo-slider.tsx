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

export interface SlidePhoto {
  src: string;
  caption: string;
}

export function PhotoSlider({ items }: { items: SlidePhoto[] }) {
  const trackRef = useRef<HTMLDivElement>(null);

  function scroll(dir: -1 | 1) {
    trackRef.current?.scrollBy({ left: dir * 320, behavior: "smooth" });
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Назад"
        onClick={() => scroll(-1)}
        className="absolute -left-3 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-navy/10 bg-white text-navy/50 shadow-sm transition hover:text-navy sm:flex"
      >
        <ChevronIcon direction="left" />
      </button>
      <button
        type="button"
        aria-label="Далее"
        onClick={() => scroll(1)}
        className="absolute -right-3 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-navy/10 bg-white text-navy/50 shadow-sm transition hover:text-navy sm:flex"
      >
        <ChevronIcon direction="right" />
      </button>

      <div
        ref={trackRef}
        className="flex gap-4 overflow-x-auto scroll-smooth pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item, i) => (
          <div
            key={i}
            className="group relative aspect-[4/3] w-[280px] shrink-0 overflow-hidden rounded-xl sm:w-[320px]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.src}
              alt={item.caption}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-navy/60 via-navy/0 to-navy/0" />
            <span className="absolute bottom-3 left-4 text-sm font-medium text-white">
              {item.caption}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
