"use client";

import { useSyncExternalStore } from "react";

// Where the visitor wants the measurement — chosen in the mobile menu or on
// the request page, remembered in this browser, and added to every request
// so the manager can plan the visit.
export const LOCATIONS = [
  "Алмазарский район",
  "Бектемирский район",
  "Мирабадский район",
  "Мирзо-Улугбекский район",
  "Сергелийский район",
  "Учтепинский район",
  "Чиланзарский район",
  "Шайхантахурский район",
  "Юнусабадский район",
  "Яккасарайский район",
  "Яшнабадский район",
  "Янгихаётский район",
  "Ташкентская область",
] as const;

const KEY = "molly_location";
const EVENT = "molly:location-change";

function read(): string {
  try {
    const saved = localStorage.getItem(KEY) ?? "";
    return (LOCATIONS as readonly string[]).includes(saved) ? saved : "";
  } catch {
    return "";
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(EVENT, onChange);
  };
}

export function saveLocation(value: string) {
  try {
    if (value) localStorage.setItem(KEY, value);
    else localStorage.removeItem(KEY);
    window.dispatchEvent(new Event(EVENT));
  } catch {
    // Storage blocked — the choice just isn't remembered.
  }
}

/** The chosen district, or "" when the visitor hasn't picked one. */
export function useLocation(): string {
  return useSyncExternalStore(subscribe, read, () => "");
}

/** Adds the chosen district to a request's notes for the manager. */
export function withLocationNote(notes: string): string {
  const location = read();
  return location ? [notes, `Район: ${location}`].filter(Boolean).join("\n\n") : notes;
}
