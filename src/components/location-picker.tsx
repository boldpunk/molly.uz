"use client";

import { useEffect, useRef, useState } from "react";
import { LOCATIONS, saveLocation, useLocation } from "@/lib/location";

function PinIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M12 21s7-6.6 7-12a7 7 0 1 0-14 0c0 5.4 7 12 7 12Z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
      <circle cx="12" cy="9" r="2.25" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

/**
 * District picker in the mobile menu. It sits at the bottom of the drawer,
 * so the list opens upwards instead of covering the buttons below it.
 */
export function LocationPicker() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 rounded-xl bg-cream-light px-3 py-2.5 text-left text-sm text-navy transition hover:bg-cream"
        aria-expanded={open}
      >
        <PinIcon className="h-4 w-4 shrink-0 text-clay" />
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] text-navy/50">Где нужен замер</span>
          <span className="block truncate font-semibold">{location || "Выберите район"}</span>
        </span>
        <svg viewBox="0 0 24 24" fill="none" className={`h-4 w-4 shrink-0 text-navy/40 transition ${open ? "rotate-180" : ""}`} aria-hidden>
          <path d="M6 15l6-6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className="absolute inset-x-0 bottom-full z-50 mb-2 max-h-72 animate-fade-in overflow-y-auto rounded-2xl border border-navy/10 bg-white p-1.5 shadow-2xl shadow-navy/15">
          {LOCATIONS.map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={() => {
                saveLocation(loc);
                setOpen(false);
              }}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition ${
                loc === location ? "bg-navy font-semibold text-white" : "text-navy/75 hover:bg-navy/5"
              }`}
            >
              {loc}
              {loc === location && <span aria-hidden>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
