"use client";

import { useMemo, useSyncExternalStore } from "react";

export interface RecentProduct {
  slug: string;
  categorySlug: string;
  name: string;
  imageUrl?: string;
  priceLabel?: string;
}

const KEY = "molly:recent";
const LIMIT = 10;
const EVENT = "molly:recent-change";

function read(): string {
  try {
    return localStorage.getItem(KEY) ?? "[]";
  } catch {
    return "[]";
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

/** Puts a product at the front of this browser's "recently viewed" list. */
export function rememberProduct(item: RecentProduct) {
  try {
    const list = (JSON.parse(read()) as RecentProduct[]).filter((p) => p.slug !== item.slug);
    localStorage.setItem(KEY, JSON.stringify([item, ...list].slice(0, LIMIT)));
    window.dispatchEvent(new Event(EVENT));
  } catch {
    // Private mode or blocked storage — the list is a nicety, so skip it.
  }
}

export function useRecentProducts(): RecentProduct[] {
  const raw = useSyncExternalStore(subscribe, read, () => "[]");
  return useMemo(() => {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as RecentProduct[]) : [];
    } catch {
      return [];
    }
  }, [raw]);
}
