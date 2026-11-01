"use client";

import { useRef, useState } from "react";
import { VIDEO_CHUNK_BYTES, VIDEO_MAX_BYTES } from "@/lib/video-upload";

export interface ReelItem {
  url: string;
  caption?: string;
}

function randomId(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function uploadVideo(file: File, onProgress: (pct: number) => void): Promise<string> {
  const id = randomId();
  const total = Math.max(1, Math.ceil(file.size / VIDEO_CHUNK_BYTES));
  for (let index = 0; index < total; index++) {
    const chunk = file.slice(index * VIDEO_CHUNK_BYTES, (index + 1) * VIDEO_CHUNK_BYTES);
    const query = new URLSearchParams({ id, index: String(index), total: String(total), name: file.name });
    const res = await fetch(`/api/admin/upload-video?${query}`, {
      method: "POST",
      headers: { "Content-Type": "application/octet-stream" },
      body: chunk,
    });
    const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
    if (!res.ok) throw new Error(data.error ?? "Не удалось загрузить видео");
    onProgress(Math.round(((index + 1) / total) * 100));
    if (data.url) return data.url;
  }
  throw new Error("Не удалось загрузить видео");
}

/** A list of short clips for the home page reels, uploaded in chunks. */
export function VideoUploadField({
  initialItems,
  onChange,
}: {
  initialItems: ReelItem[];
  onChange: (items: ReelItem[]) => void;
}) {
  const [items, setItems] = useState<ReelItem[]>(initialItems);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function update(next: ReelItem[]) {
    setItems(next);
    onChange(next);
  }

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setError("");
    let next = items;
    for (const file of Array.from(files)) {
      if (!/^video\/(mp4|webm)$/.test(file.type)) {
        setError(`«${file.name}» — нужен MP4 или WebM`);
        continue;
      }
      if (file.size > VIDEO_MAX_BYTES) {
        setError(`«${file.name}» больше ${VIDEO_MAX_BYTES / 1024 / 1024} МБ — сожмите его или обрежьте`);
        continue;
      }
      try {
        setProgress(0);
        const url = await uploadVideo(file, setProgress);
        next = [...next, { url, caption: "" }];
        update(next);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Не удалось загрузить видео");
      }
    }
    setProgress(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function move(from: number, to: number) {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    update(next);
  }

  return (
    <div className="flex flex-col gap-4">
      {items.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {items.map((item, i) => (
            <li key={item.url} className="flex flex-col gap-2">
              <div className="relative aspect-[9/16] overflow-hidden rounded-xl bg-navy/5">
                <video src={item.url} muted loop playsInline autoPlay className="h-full w-full object-cover" />
                <div className="absolute right-1.5 top-1.5 flex gap-1">
                  <button type="button" onClick={() => move(i, i - 1)} className="rounded-full bg-white/90 px-2 py-0.5 text-xs" aria-label="Левее">←</button>
                  <button type="button" onClick={() => move(i, i + 1)} className="rounded-full bg-white/90 px-2 py-0.5 text-xs" aria-label="Правее">→</button>
                  <button
                    type="button"
                    onClick={() => update(items.filter((_, j) => j !== i))}
                    className="rounded-full bg-white/90 px-2 py-0.5 text-xs text-red-600"
                    aria-label="Убрать"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <input
                value={item.caption ?? ""}
                onChange={(e) => update(items.map((it, j) => (j === i ? { ...it, caption: e.target.value } : it)))}
                placeholder="Подпись (необязательно)"
                className="input py-1.5 text-xs"
              />
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={progress !== null}
          className="rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {progress !== null ? `Загрузка… ${progress}%` : "Добавить ролики"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="video/mp4,video/webm"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <span className="text-xs text-navy/50">
          Вертикальные ролики из Instagram (Reels) — MP4, до {VIDEO_MAX_BYTES / 1024 / 1024} МБ. На сайте играют без звука по кругу, звук — по нажатию.
        </span>
      </div>
      {progress !== null && (
        <div className="h-1.5 overflow-hidden rounded-full bg-navy/10">
          <div className="h-full bg-clay transition-[width]" style={{ width: `${progress}%` }} />
        </div>
      )}
      {error && <p className="text-sm font-medium text-red-600">{error}</p>}
    </div>
  );
}
