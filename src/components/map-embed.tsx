"use client";

import { useState } from "react";

/**
 * The OpenStreetMap embed pulls in close to a megabyte of scripts, so the
 * page shows a light drawn stand-in and loads the real map on request.
 */
export function MapEmbed({ src, title }: { src: string; title: string }) {
  const [active, setActive] = useState(false);

  if (active) {
    return <iframe title={title} src={src} className="h-full min-h-[380px] w-full animate-fade-in" />;
  }

  return (
    <button
      type="button"
      onClick={() => setActive(true)}
      className="group relative flex h-full min-h-[380px] w-full items-center justify-center overflow-hidden bg-[#eef0ea]"
    >
      {/* Streets, blocks and a river, drawn rather than downloaded */}
      <svg aria-hidden viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
        <rect width="400" height="300" fill="#eef0ea" />
        <path d="M-20 210 C 80 180, 140 250, 240 215 S 380 170, 430 190" stroke="#c9dbe6" strokeWidth="22" fill="none" />
        <g fill="#e2e4dc">
          <rect x="30" y="30" width="70" height="50" rx="4" />
          <rect x="120" y="25" width="90" height="60" rx="4" />
          <rect x="230" y="40" width="60" height="45" rx="4" />
          <rect x="310" y="20" width="80" height="70" rx="4" />
          <rect x="40" y="105" width="85" height="55" rx="4" />
          <rect x="250" y="110" width="110" height="45" rx="4" />
        </g>
        <rect x="150" y="105" width="75" height="55" rx="6" fill="#d7e6cf" />
        <g stroke="#fff" strokeLinecap="round" fill="none">
          <path d="M0 95 H400" strokeWidth="10" />
          <path d="M110 0 V300" strokeWidth="8" />
          <path d="M300 0 L 240 300" strokeWidth="8" />
          <path d="M0 170 H400" strokeWidth="6" />
        </g>
      </svg>
      <span className="relative flex flex-col items-center gap-3">
        <span className="relative flex h-14 w-14 items-center justify-center">
          <span aria-hidden className="absolute inset-0 animate-pulse-ring rounded-full bg-clay/40" />
          <svg viewBox="0 0 24 24" className="relative h-10 w-10 drop-shadow-lg" aria-hidden>
            <path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z" fill="#c2714f" />
            <circle cx="12" cy="10" r="2.6" fill="#fff" />
          </svg>
        </span>
        <span className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-navy shadow-lg transition group-hover:bg-navy group-hover:text-white">
          Показать на карте
        </span>
      </span>
    </button>
  );
}
