"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

// A small always-reachable way to talk to Molly Home: one tap opens the
// Telegram bot, the phone or the measurement request. It stays out of the
// way until the visitor has scrolled past the first screen.
export function FloatingContact({
  phone,
  telegramBot,
}: {
  phone: string;
  telegramBot: string;
}) {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 320);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const actions = [
    {
      label: "Написать в Telegram",
      href: `https://t.me/${telegramBot}`,
      external: true,
      bg: "bg-[#2aabee]",
      icon: (
        <path d="M21.5 4.3 2.9 11.5c-1.3.5-1.3 1.2-.2 1.6l4.8 1.5 1.8 5.6c.2.6.1.9.8.9.5 0 .7-.2 1-.5l2.3-2.3 4.9 3.6c.9.5 1.5.2 1.8-.8l3.2-15.2c.3-1.3-.5-1.9-1.8-1.4Zm-3.3 3.5-8.9 8-.3 3.7-1.7-5.5 10.3-6.5c.5-.3.9-.1.6.3Z" fill="currentColor" />
      ),
    },
    {
      label: "Позвонить",
      href: `tel:${phone.replace(/[^+\d]/g, "")}`,
      external: false,
      bg: "bg-sage",
      icon: (
        <path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1l-2.3 2.2Z" fill="currentColor" />
      ),
    },
    {
      label: "Заявка на замер",
      href: "/request",
      external: false,
      bg: "bg-clay",
      icon: (
        <path d="M4 20h16M6 16V8m4 8V4m4 12V8m4 8v-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
      ),
    },
  ];

  return (
    <div
      className={`fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3 transition duration-500 sm:bottom-8 sm:right-8 ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"
      }`}
    >
      <ul className="flex flex-col items-end gap-2.5">
        {actions.map((a, i) => (
          <li
            key={a.label}
            className={`transition duration-300 ${
              open ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
            }`}
            style={{ transitionDelay: open ? `${(actions.length - i) * 50}ms` : "0ms" }}
          >
            <Link
              href={a.href}
              target={a.external ? "_blank" : undefined}
              rel={a.external ? "noreferrer" : undefined}
              tabIndex={open ? 0 : -1}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-full bg-white py-1.5 pl-4 pr-1.5 text-sm font-medium text-navy shadow-lg shadow-navy/10 ring-1 ring-navy/5 transition hover:-translate-x-1"
            >
              {a.label}
              <span className={`flex h-9 w-9 items-center justify-center rounded-full text-white ${a.bg}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
                  {a.icon}
                </svg>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Закрыть" : "Связаться с нами"}
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-navy text-white shadow-xl shadow-navy/30 transition hover:bg-clay"
      >
        {!open && (
          <span aria-hidden className="absolute inset-0 rounded-full bg-navy animate-pulse-ring" />
        )}
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
          className={`relative transition duration-300 ${open ? "rotate-90" : ""}`}
        >
          {open ? (
            <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          ) : (
            <path d="M4 5h16v11H8l-4 4V5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          )}
        </svg>
      </button>
    </div>
  );
}
