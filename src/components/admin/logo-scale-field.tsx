"use client";

/* eslint-disable @next/next/no-img-element */

import { useState, useTransition } from "react";
import { saveLogoScale } from "@/lib/brand-actions";
import {
  LOGO_SCALE_MAX,
  LOGO_SCALE_MIN,
  clampLogoScale,
} from "@/lib/brand-config";

// The header logo is the widest placement, so its width is what the preview
// and the brand book's 160px minimum are measured against.
const HEADER_WIDTH_PX = 168;

export function LogoScaleField({
  initialScale,
  previewUrl,
}: {
  initialScale: number;
  previewUrl: string;
}) {
  const [scale, setScale] = useState(initialScale);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const headerWidth = Math.round((HEADER_WIDTH_PX * scale) / 100);
  const belowMinimum = headerWidth < 160;

  function commit(next: number) {
    const value = clampLogoScale(next);
    setScale(value);
    setSaved(false);
    startTransition(async () => {
      await saveLogoScale(value);
      setSaved(true);
    });
  }

  return (
    <div className="rounded-xl border border-navy/10 bg-white p-5">
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-navy">Размер логотипа</h3>
        <span className="font-mono text-xs font-semibold text-navy">
          {scale}%
        </span>
      </div>
      <p className="mb-4 text-xs text-navy/50">
        Применяется ко всем местам сразу: шапка и подвал сайта, мобильное меню,
        панель управления, КП.
      </p>

      <div className="mb-4 flex min-h-[90px] items-center rounded-lg border border-navy/10 bg-navy/[0.02] px-5 py-4">
        <img
          src={previewUrl}
          alt="Логотип"
          style={{ width: headerWidth }}
          className="h-auto"
        />
      </div>

      <input
        type="range"
        min={LOGO_SCALE_MIN}
        max={LOGO_SCALE_MAX}
        step={5}
        value={scale}
        onChange={(e) => setScale(Number(e.target.value))}
        onPointerUp={(e) => commit(Number(e.currentTarget.value))}
        onKeyUp={(e) => commit(Number(e.currentTarget.value))}
        disabled={pending}
        className="w-full accent-navy"
      />

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {[75, 100, 125].map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => commit(preset)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              scale === preset
                ? "border-navy bg-navy/5 text-navy"
                : "border-navy/10 text-navy/55 hover:bg-navy/5"
            }`}
          >
            {preset}%
          </button>
        ))}
        <span className="text-xs text-navy/40">
          В шапке: {headerWidth} px
        </span>
        {saved && !pending && (
          <span className="text-xs font-medium text-emerald-600">
            Сохранено
          </span>
        )}
      </div>

      {belowMinimum && (
        <p className="mt-3 text-xs text-amber-700">
          Меньше 160 px — брендбук считает, что на такой ширине слово HOME уже
          не читается.
        </p>
      )}
    </div>
  );
}
