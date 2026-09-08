"use client";

import { useState } from "react";

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

function formatUzPhone(digits: string): string {
  const parts = [
    digits.slice(0, 2),
    digits.slice(2, 5),
    digits.slice(5, 7),
    digits.slice(7, 9),
  ].filter(Boolean);
  return `+998${parts.length ? " " + parts.join(" ") : ""}`;
}

function extractLocalDigits(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.length > 9 && digits.startsWith("998")) {
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
  className = "input",
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
  const [internal, setInternal] = useState(() =>
    extractLocalDigits(defaultValue ?? value ?? "")
  );
  const digits = value !== undefined ? extractLocalDigits(value) : internal;
  const display = formatUzPhone(digits);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const nextDigits = extractLocalDigits(e.target.value);
    const formatted = formatUzPhone(nextDigits);
    if (value === undefined) setInternal(nextDigits);
    onChange?.(formatted);
  }

  return (
    <div className="relative">
      <input
        type="tel"
        inputMode="numeric"
        required={required}
        autoFocus={autoFocus}
        name={name}
        value={display}
        onChange={handleChange}
        className={`${className} pr-10`}
        placeholder="+998 90 123 45 67"
      />
      <UzFlagIcon className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-5 -translate-y-1/2 rounded-[1px] shadow-[0_0_0_1px_rgba(24,43,76,0.12)]" />
    </div>
  );
}
