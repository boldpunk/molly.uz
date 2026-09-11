"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { uploadProductImage } from "@/lib/upload-actions";

export function ImageUploadField({
  name,
  initialUrl,
}: {
  name: string;
  initialUrl?: string;
}) {
  const [url, setUrl] = useState(initialUrl ?? "");
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus("uploading");
    setError(null);

    const formData = new FormData();
    formData.set("file", file);
    const result = await uploadProductImage(formData);

    if ("error" in result) {
      setStatus("error");
      setError(result.error);
      return;
    }

    setUrl(result.url);
    setStatus("idle");
  }

  function handleRemove() {
    setUrl("");
    setError(null);
    setStatus("idle");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="flex flex-col gap-3">
      <input type="hidden" name={name} value={url} />
      <div className="flex items-center gap-4">
        <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-navy/10 bg-navy/[0.02]">
          {url ? (
            <Image src={url} alt="Фото товара" fill sizes="96px" className="object-cover" />
          ) : (
            <span className="text-center text-[10px] text-navy/30">
              Нет фото
            </span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-full border border-navy/15 px-4 py-2 text-sm font-medium text-navy transition hover:bg-navy/5">
            {status === "uploading" ? "Загружаем…" : url ? "Заменить фото" : "Загрузить фото"}
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              onChange={handleFileChange}
              disabled={status === "uploading"}
              className="hidden"
            />
          </label>
          {url && (
            <button
              type="button"
              onClick={handleRemove}
              className="w-fit text-xs font-medium text-navy/50 hover:text-red-600"
            >
              Удалить фото
            </button>
          )}
          {error && <p className="text-xs text-red-600">{error}</p>}
          <p className="text-xs text-navy/40">JPEG, PNG, WebP или AVIF, до 8 МБ</p>
        </div>
      </div>
    </div>
  );
}
