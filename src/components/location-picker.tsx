"use client";

import { useEffect, useRef, useState } from "react";

const LOCATIONS = [
  "Ташкент",
  "Мирзо-Улугбекский район",
  "Юнусабадский район",
  "Чиланзарский район",
  "Яшнабадский район",
  "Мирабадский район",
  "Сергелийский район",
  "Ташкентская область",
] as const;

const STORAGE_KEY = "molly_location";

function PinIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 21s7-6.6 7-12a7 7 0 1 0-14 0c0 5.4 7 12 7 12Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="9" r="2.25" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

export function LocationPicker() {
  const [open, setOpen] = useState(false);
  const [location, setLocation] = useState<string>(LOCATIONS[0]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved && (LOCATIONS as readonly string[]).includes(saved)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrating client-only preference from localStorage after mount
        setLocation(saved);
      }
    } catch {
      // localStorage unavailable — keep default
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function select(value: string) {
    setLocation(value);
    setOpen(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // ignore
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 hover:text-navy"
        aria-expanded={open}
      >
        <PinIcon className="h-3.5 w-3.5 text-navy/50" />
        {location}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={`h-3 w-3 text-navy/40 transition ${open ? "rotate-180" : ""}`}
        >
          <path
            d="M6 9l6 6 6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-56 rounded-lg border border-navy/10 bg-white p-1.5 shadow-lg">
          {LOCATIONS.map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={() => select(loc)}
              className={`flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs transition ${
                loc === location
                  ? "bg-accent/20 font-medium text-navy"
                  : "text-navy/70 hover:bg-navy/5"
              }`}
            >
              {loc}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
