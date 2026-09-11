"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { uploadProductImage } from "@/lib/upload-actions";

type UploadResult = { url: string } | { error: string };

export function GalleryUploadField({
  name,
  initialUrls,
  uploadAction = uploadProductImage,
  hint = "Дополнительные ракурсы товара — JPEG, PNG, WebP или AVIF, до 8 МБ каждое",
  onChange,
}: {
  name?: string;
  initialUrls: string[];
  uploadAction?: (formData: FormData) => Promise<UploadResult>;
  hint?: string;
  onChange?: (urls: string[]) => void;
}) {
  const [urls, setUrls] = useState<string[]>(initialUrls);
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function updateUrls(next: string[]) {
    setUrls(next);
    onChange?.(next);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus("uploading");
    setError(null);

    const formData = new FormData();
    formData.set("file", file);
    const result = await uploadAction(formData);

    if ("error" in result) {
      setStatus("error");
      setError(result.error);
      return;
    }

    updateUrls([...urls, result.url]);
    setStatus("idle");
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleRemove(url: string) {
    updateUrls(urls.filter((u) => u !== url));
  }

  return (
    <div className="flex flex-col gap-3">
      {name && <input type="hidden" name={name} value={JSON.stringify(urls)} />}
      <div className="flex flex-wrap gap-3">
        {urls.map((url) => (
          <div
            key={url}
            className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-navy/10"
          >
            <Image src={url} alt="" fill sizes="80px" className="object-cover" />
            <button
              type="button"
              onClick={() => handleRemove(url)}
              aria-label="Удалить фото"
              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-navy/70 text-xs text-white opacity-0 transition group-hover:opacity-100"
            >
              ×
            </button>
          </div>
        ))}
        <label className="flex h-20 w-20 shrink-0 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-navy/20 text-navy/40 transition hover:bg-navy/[0.03] hover:text-navy">
          <span className="text-lg leading-none">+</span>
          <span className="text-[10px]">
            {status === "uploading" ? "Загрузка…" : "Добавить"}
          </span>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            onChange={handleFileChange}
            disabled={status === "uploading"}
            className="hidden"
          />
        </label>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <p className="text-xs text-navy/40">{hint}</p>
    </div>
  );
}
