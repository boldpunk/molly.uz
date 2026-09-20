"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useId, useRef, useState } from "react";
import { uploadProposalImage } from "@/lib/upload-actions";

// Only the most recently opened picker reacts to a document-level paste, so
// opening a second one on another item can't make both swallow the same
// screenshot.
let pasteOwner: string | null = null;

function isImageFile(file: File): boolean {
  return file.type.startsWith("image/");
}

export function ImageDropField({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlDraft, setUrlDraft] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const zoneRef = useRef<HTMLDivElement>(null);

  async function upload(file: File) {
    if (!isImageFile(file)) {
      setError("Это не изображение. Нужен JPG, PNG или WEBP.");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.set("file", file);
      const result = await uploadProposalImage(formData);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      onChange(result.url);
      setOpen(false);
      setUrlDraft("");
    } catch {
      setError("Не удалось загрузить файл. Попробуйте фото меньшего размера.");
    } finally {
      setUploading(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    pasteOwner = id;

    function handlePaste(event: ClipboardEvent) {
      if (pasteOwner !== id) return;
      const files = Array.from(event.clipboardData?.files ?? []);
      const image = files.find(isImageFile);
      if (image) {
        event.preventDefault();
        void upload(image);
        return;
      }
      const text = event.clipboardData?.getData("text")?.trim();
      if (text && /^https?:\/\//i.test(text)) {
        event.preventDefault();
        onChange(text);
        setOpen(false);
      }
    }

    document.addEventListener("paste", handlePaste);
    zoneRef.current?.focus();
    return () => {
      document.removeEventListener("paste", handlePaste);
      if (pasteOwner === id) pasteOwner = null;
    };
    // `upload` and `onChange` are stable for the lifetime of a row; re-binding
    // on every render would drop the listener mid-paste.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, id]);

  function applyUrl() {
    const next = urlDraft.trim();
    if (!next) return;
    if (!/^https?:\/\//i.test(next) && !next.startsWith("/")) {
      setError("Адрес должен начинаться с http:// или https://");
      return;
    }
    onChange(next);
    setUrlDraft("");
    setOpen(false);
    setError(null);
  }

  if (!open) {
    return (
      <div className="flex flex-col gap-2">
        <div className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-lg border border-navy/10 bg-navy/[0.02]">
          {value ? (
            <img
              src={value}
              alt=""
              className="h-full w-full object-contain"
            />
          ) : (
            <span className="px-2 text-center text-[11px] text-navy/30">
              Нет фото
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setError(null);
              setOpen(true);
            }}
            className="rounded-full border border-navy/15 px-3 py-1.5 text-xs font-medium text-navy transition hover:bg-navy/5"
          >
            {value ? "Заменить" : "Добавить фото"}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="text-xs font-medium text-navy/40 transition hover:text-red-600"
            >
              Удалить
            </button>
          )}
        </div>
        {error && <p className="text-[11px] text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-navy/10 bg-white p-2 shadow-sm">
      <input
        type="text"
        value={urlDraft}
        onChange={(e) => setUrlDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            applyUrl();
          }
        }}
        placeholder="Введите адрес изображения"
        className="w-full rounded-full border border-navy/10 bg-navy/[0.02] px-3 py-2 text-xs text-navy outline-none placeholder:text-navy/30 focus:border-navy/25"
      />

      <div
        ref={zoneRef}
        tabIndex={-1}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = Array.from(e.dataTransfer.files).find(isImageFile);
          if (file) {
            void upload(file);
            return;
          }
          const dropped = e.dataTransfer.getData("text")?.trim();
          if (dropped && /^https?:\/\//i.test(dropped)) {
            onChange(dropped);
            setOpen(false);
          }
        }}
        className={`flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-3 py-6 text-center outline-none transition ${
          dragging
            ? "border-navy/60 bg-navy/5"
            : "border-navy/15 bg-navy/[0.015]"
        }`}
      >
        {uploading ? (
          <p className="text-xs font-medium text-navy/60">Загружаем…</p>
        ) : (
          <>
            <p className="text-xs leading-relaxed text-navy/50">
              Перетащите изображение сюда
              <br />
              или вставьте с помощью Ctrl+V
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-full bg-navy px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-navy/90"
            >
              Выбрать файл
            </button>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void upload(file);
            e.target.value = "";
          }}
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError(null);
            setUrlDraft("");
          }}
          className="flex-1 rounded-full bg-navy/5 px-3 py-2 text-xs font-medium text-navy/60 transition hover:bg-navy/10"
        >
          Отменить
        </button>
        {urlDraft.trim() && (
          <button
            type="button"
            onClick={applyUrl}
            className="flex-1 rounded-full bg-navy px-3 py-2 text-xs font-semibold text-white transition hover:bg-navy/90"
          >
            Готово
          </button>
        )}
      </div>

      {error && <p className="text-[11px] text-red-600">{error}</p>}
    </div>
  );
}
