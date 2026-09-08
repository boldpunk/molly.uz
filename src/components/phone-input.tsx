"use client";

import { useRef, useState, useLayoutEffect } from "react";

function UzFlagIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 14" className={className} aria-hidden="true">
      <rect width="20" height="14" fill="#fff" />
      <rect width="20" height="4" fill="#0099B5" />
      <rect y="10" width="20" height="4" fill="#1EB53A" />
      <rect y="3.6" width="20" height="0.8" fill="#CE1126" />
      <rect y="9.6" width="20" height="0.8" fill="#CE1126" />
      <circle cx="3.2" cy="2" r="1.3" fill="#fff" />
      <circle cx="3.7" cy="2" r="1.1" fill="#0099B5" />
      {[0, 1, 2, 3, 4].map((i) => (
        <circle key={i} cx={5.5 + i * 1.3} cy="1.2" r="0.22" fill="#fff" />
      ))}
      {[0, 1, 2, 3].map((i) => (
        <circle key={i} cx={6.15 + i * 1.3} cy="2.1" r="0.22" fill="#fff" />
      ))}
    </svg>
  );
}

// Formats up to 9 local digits as "XX XXX XX XX" (no country code).
function formatLocal(digits: string): string {
  return [
    digits.slice(0, 2),
    digits.slice(2, 5),
    digits.slice(5, 7),
    digits.slice(7, 9),
  ]
    .filter(Boolean)
    .join(" ");
}

// Extracts the 9-digit local number from arbitrary input, stripping a
// leading "998" (however many times it appears, e.g. from a pasted
// "+998 998 90 ...") rather than assuming it appears at most once.
function extractLocalDigits(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  while (digits.length > 9 && digits.startsWith("998")) {
    digits = digits.slice(3);
  }
  return digits.slice(0, 9);
}

export function PhoneInput({
  name,
  required,
  defaultValue,
  value,
  onChange,
  className = "",
  autoFocus,
}: {
  name?: string;
  required?: boolean;
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  autoFocus?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [internal, setInternal] = useState(() =>
    extractLocalDigits(defaultValue ?? value ?? "")
  );
  const [pendingCursor, setPendingCursor] = useState<number | null>(null);

  const digits = value !== undefined ? extractLocalDigits(value) : internal;
  const localDisplay = formatLocal(digits);
  const fullValue = `+998${digits.length ? " " + localDisplay : ""}`;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    const selStart = e.target.selectionStart ?? raw.length;
    const digitsBeforeCursor = raw.slice(0, selStart).replace(/\D/g, "").length;

    const nextDigits = extractLocalDigits(raw);
    if (value === undefined) setInternal(nextDigits);
    onChange?.(`+998${nextDigits.length ? " " + formatLocal(nextDigits) : ""}`);
    setPendingCursor(Math.min(digitsBeforeCursor, nextDigits.length));
  }

  useLayoutEffect(() => {
    if (pendingCursor === null || !inputRef.current) return;
    const pos = formatLocal(digits.slice(0, pendingCursor)).length;
    inputRef.current.setSelectionRange(pos, pos);
    setPendingCursor(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localDisplay]);

  return (
    <div
      className={`flex w-full items-center gap-2 rounded-md border border-navy/15 bg-white px-3 py-2 text-sm transition focus-within:border-navy/40 focus-within:ring-2 focus-within:ring-navy/[0.06] ${className}`}
    >
      <span className="shrink-0 text-navy/60">+998</span>
      <input
        ref={inputRef}
        type="tel"
        inputMode="numeric"
        autoComplete="tel"
        required={required}
        autoFocus={autoFocus}
        value={localDisplay}
        onChange={handleChange}
        placeholder="90 123 45 67"
        className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm text-navy outline-none placeholder:text-navy/30"
      />
      <UzFlagIcon className="h-3.5 w-5 shrink-0 rounded-[1px] shadow-[0_0_0_1px_rgba(24,43,76,0.12)]" />
      {name && <input type="hidden" name={name} value={fullValue} />}
    </div>
  );
}
