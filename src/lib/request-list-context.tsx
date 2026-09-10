"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { RequestItem } from "./types";

interface RequestListContextValue {
  items: RequestItem[];
  addItem: (item: RequestItem) => void;
  removeItem: (index: number) => void;
  clear: () => void;
}

const RequestListContext = createContext<RequestListContextValue | null>(
  null
);

const STORAGE_KEY = "molly-home-request-list";

export function RequestListProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [items, setItems] = useState<RequestItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Reads once on mount to sync with the browser's localStorage.
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // ignore unavailable storage
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore unavailable storage
    }
  }, [items, hydrated]);

  const addItem = useCallback((item: RequestItem) => {
    setItems((prev) => [...prev, item]);
  }, []);

  const removeItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo(
    () => ({ items, addItem, removeItem, clear }),
    [items, addItem, removeItem, clear]
  );

  return (
    <RequestListContext.Provider value={value}>
      {children}
    </RequestListContext.Provider>
  );
}

export function useRequestList() {
  const ctx = useContext(RequestListContext);
  if (!ctx) {
    throw new Error("useRequestList must be used within RequestListProvider");
  }
  return ctx;
}
