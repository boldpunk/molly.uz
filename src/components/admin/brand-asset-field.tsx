"use client";

/* eslint-disable @next/next/no-img-element */

import { useRef, useState, useTransition } from "react";
import { uploadBrandAsset } from "@/lib/upload-actions";
import { saveBrandAsset } from "@/lib/brand-actions";

export function BrandAssetField({
  slot,
  label,
  hint,
  currentUrl,
  fallbackUrl,
  dark = false,
}: {
  slot: string;
  label: string;
  hint: string;
  currentUrl: string | null;
  fallbackUrl: string;
  dark?: boolean;
}) {
  const [url, setUrl] = useState(currentUrl ?? "");
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const preview = url || fallbackUrl;
  const usingFallback = !url;

  async function upload(file: File) {
    setUploading(true);
    setError(null);
    setSaved(false);
    try {
      const formData = new FormData();
      formData.set("file", file);
      const result = await uploadBrandAsset(formData);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setUrl(result.url);
      persist(result.url);
    } catch {
      setError("Не удалось загрузить файл.");
    } finally {
      setUploading(false);
    }
  }

  function persist(next: string) {
    const formData = new FormData();
    formData.set("url", next);
    startTransition(async () => {
      await saveBrandAsset(slot, formData);
      setSaved(true);
    });
  }

  return (
    <div className="rounded-xl border border-navy/10 bg-white p-5">
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-navy">{label}</h3>
        {usingFallback ? (
          <span className="text-[11px] font-medium text-navy/35">
            Логотип из брендбука
          </span>
        ) : (
          <span className="text-[11px] font-medium text-emerald-600">
            Свой файл
          </span>
        )}
      </div>
      <p className="mb-4 text-xs text-navy/50">{hint}</p>

      <div
        className={`mb-4 flex min-h-[110px] items-center justify-center rounded-lg p-5 ${
          dark ? "bg-navy" : "border border-navy/10 bg-navy/[0.02]"
        }`}
      >
        <img
          src={preview}
          alt={label}
          className="max-h-[80px] w-auto max-w-full"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading || pending}
          className="rounded-full border border-navy/15 px-4 py-2 text-xs font-semibold text-navy transition hover:bg-navy/5 disabled:opacity-50"
        >
          {uploading ? "Загружаем…" : "Загрузить SVG"}
        </button>
        {!usingFallback && (
          <button
            type="button"
            onClick={() => {
              setUrl("");
              persist("");
            }}
            disabled={pending}
            className="text-xs font-medium text-navy/45 transition hover:text-red-600 disabled:opacity-50"
          >
            Вернуть логотип из брендбука
          </button>
        )}
        {saved && !pending && (
          <span className="text-xs font-medium text-emerald-600">
            Сохранено
          </span>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/svg+xml,.svg,image/png,image/webp,image/jpeg"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void upload(file);
            e.target.value = "";
          }}
        />
      </div>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
