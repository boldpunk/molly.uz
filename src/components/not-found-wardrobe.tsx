"use client";

import Link from "next/link";
import { useState } from "react";

const DOORS = [
  { href: "/catalog", label: "Каталог", note: "кухни, шкафы, диваны", hinge: "left" },
  { href: "/configurator/shkaf", label: "Конфигуратор", note: "соберите свой шкаф", hinge: "left" },
  { href: "/", label: "Главная", note: "начать сначала", hinge: "right" },
] as const;

/**
 * A three-door wardrobe whose doors open onto the main sections of the site
 * — hover on desktop, tap on touch screens.
 */
export function NotFoundWardrobe() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="relative rounded-t-xl bg-[#eadfce] p-2 shadow-2xl shadow-navy/15 ring-1 ring-[#c4b098]">
        <div className="grid grid-cols-3 gap-1.5 [perspective:1400px]">
          {DOORS.map((door, i) => {
            const isOpen = open === i;
            const fromLeft = door.hinge === "left";
            return (
              <div
                key={door.href}
                className="group relative h-64 sm:h-80"
                // Hover opens doors only for a real mouse; on touch screens a
                // tap would otherwise open the door and the click close it.
                onPointerEnter={(e) => e.pointerType === "mouse" && setOpen(i)}
                onPointerLeave={(e) => e.pointerType === "mouse" && setOpen((o) => (o === i ? null : o))}
              >
                {/* Interior */}
                <Link
                  href={door.href}
                  className="absolute inset-0 flex flex-col items-center justify-end gap-1 rounded-sm bg-gradient-to-b from-[#d6c6b0] to-[#e9dccb] px-2 pb-6 text-center"
                  tabIndex={isOpen ? 0 : -1}
                >
                  <span aria-hidden className="absolute inset-x-2 top-[22%] h-1 rounded bg-[#c4b098]" />
                  <span aria-hidden className="absolute inset-x-2 top-[48%] h-1 rounded bg-[#c4b098]" />
                  <span className="font-heading text-sm font-bold text-navy sm:text-base">{door.label}</span>
                  <span className="text-[11px] leading-tight text-navy/55">{door.note}</span>
                  <span className="mt-2 flex h-8 w-8 items-center justify-center rounded-full bg-navy text-white">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </Link>

                {/* Door */}
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-label={`Открыть дверь: ${door.label}`}
                  aria-expanded={isOpen}
                  className={`absolute inset-0 rounded-sm bg-[#f6f1ea] shadow-[inset_0_0_0_1px_rgba(24,43,76,0.08)] transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    fromLeft ? "origin-left" : "origin-right"
                  } ${isOpen ? (fromLeft ? "[transform:rotateY(-98deg)] bg-[#e4dacb]" : "[transform:rotateY(98deg)] bg-[#e4dacb]") : ""} ${
                    i === 1 && open === null ? "animate-door-peek" : ""
                  } ${isOpen ? "pointer-events-none" : ""}`}
                >
                  <span aria-hidden className="absolute inset-y-3 left-1/2 w-px -translate-x-1/2 bg-navy/[0.06]" />
                  <span
                    aria-hidden
                    className={`absolute top-1/2 h-20 w-1 -translate-y-1/2 rounded-full bg-ink ${fromLeft ? "right-3" : "left-3"}`}
                  />
                  <span className="absolute inset-x-0 bottom-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-navy/25">
                    {door.label}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
      <div className="mx-1 h-4 rounded-b-md bg-[#d6c6b0]" />
      <div className="mx-auto h-3 w-[90%] rounded-[50%] bg-navy/10 blur-md" />
      <p className="mt-3 text-center text-xs text-navy/45">Откройте любую дверцу</p>
    </div>
  );
}
