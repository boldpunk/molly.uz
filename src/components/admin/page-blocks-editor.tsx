"use client";

import { useRef, useState } from "react";
import { PlusIcon, TrashIcon } from "./icons";
import { uploadPageImage } from "@/lib/upload-actions";
import type { PageBlock } from "@/db/schema";

const BLOCK_LABELS: Record<PageBlock["type"], string> = {
  heading: "Заголовок",
  paragraph: "Абзац",
  image: "Изображение",
  stat_list: "Список показателей",
  cta: "Кнопка (CTA)",
};

function emptyBlock(type: PageBlock["type"]): PageBlock {
  switch (type) {
    case "heading":
      return { type, text: "" };
    case "paragraph":
      return { type, text: "" };
    case "image":
      return { type, url: "", alt: "" };
    case "stat_list":
      return { type, items: [] };
    case "cta":
      return { type, label: "", href: "" };
  }
}

export function PageBlocksEditor({
  name,
  initialBlocks,
}: {
  name: string;
  initialBlocks: PageBlock[];
}) {
  const [blocks, setBlocks] = useState<PageBlock[]>(initialBlocks);

  function update(i: number, next: PageBlock) {
    setBlocks((prev) => prev.map((b, idx) => (idx === i ? next : b)));
  }
  function remove(i: number) {
    setBlocks((prev) => prev.filter((_, idx) => idx !== i));
  }
  function move(i: number, dir: -1 | 1) {
    setBlocks((prev) => {
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }
  function addBlock(type: PageBlock["type"]) {
    setBlocks((prev) => [...prev, emptyBlock(type)]);
  }

  return (
    <div className="flex flex-col gap-4">
      <input type="hidden" name={name} value={JSON.stringify(blocks)} />

      {blocks.length === 0 ? (
        <p className="rounded-lg border border-dashed border-navy/15 px-3 py-6 text-center text-xs text-navy/40">
          На странице пока нет блоков.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {blocks.map((block, i) => (
            <BlockCard
              key={i}
              block={block}
              onChange={(next) => update(i, next)}
              onRemove={() => remove(i)}
              onMoveUp={i > 0 ? () => move(i, -1) : undefined}
              onMoveDown={i < blocks.length - 1 ? () => move(i, 1) : undefined}
            />
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {(Object.keys(BLOCK_LABELS) as PageBlock["type"][]).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => addBlock(type)}
            className="inline-flex items-center gap-1 rounded-full bg-sage/15 px-3 py-1.5 text-xs font-semibold text-sage-dark transition hover:bg-sage/25"
          >
            <PlusIcon className="h-3 w-3" />
            {BLOCK_LABELS[type]}
          </button>
        ))}
      </div>
    </div>
  );
}

function IconButton({
  onClick,
  disabled,
  label,
  children,
}: {
  onClick?: () => void;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex h-7 w-7 items-center justify-center rounded-md text-navy/40 transition hover:bg-navy/5 hover:text-navy disabled:pointer-events-none disabled:opacity-25"
    >
      {children}
    </button>
  );
}

function BlockCard({
  block,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  block: PageBlock;
  onChange: (b: PageBlock) => void;
  onRemove: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}) {
  return (
    <div className="rounded-lg border border-navy/10 bg-white p-3">
      <div className="flex items-center justify-between border-b border-navy/5 pb-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-navy/40">
          {BLOCK_LABELS[block.type]}
        </span>
        <div className="flex items-center gap-0.5">
          <IconButton onClick={onMoveUp} disabled={!onMoveUp} label="Переместить вверх">
            ↑
          </IconButton>
          <IconButton onClick={onMoveDown} disabled={!onMoveDown} label="Переместить вниз">
            ↓
          </IconButton>
          <IconButton onClick={onRemove} label="Удалить блок">
            <TrashIcon className="h-3.5 w-3.5" />
          </IconButton>
        </div>
      </div>
      <div className="mt-3">
        <BlockFields block={block} onChange={onChange} />
      </div>
    </div>
  );
}

function BlockFields({
  block,
  onChange,
}: {
  block: PageBlock;
  onChange: (b: PageBlock) => void;
}) {
  switch (block.type) {
    case "heading":
      return (
        <input
          value={block.text}
          onChange={(e) => onChange({ ...block, text: e.target.value })}
          placeholder="Заголовок раздела"
          className="input"
        />
      );
    case "paragraph":
      return (
        <textarea
          value={block.text}
          onChange={(e) => onChange({ ...block, text: e.target.value })}
          rows={4}
          placeholder="Текст абзаца"
          className="input"
        />
      );
    case "image":
      return <BlockImageField block={block} onChange={onChange} />;
    case "cta":
      return (
        <div className="grid grid-cols-2 gap-2">
          <input
            value={block.label}
            onChange={(e) => onChange({ ...block, label: e.target.value })}
            placeholder="Текст кнопки"
            className="input"
          />
          <input
            value={block.href}
            onChange={(e) => onChange({ ...block, href: e.target.value })}
            placeholder="/catalog/kuhonnaya-mebel"
            className="input font-mono text-xs"
          />
        </div>
      );
    case "stat_list":
      return <StatListFields block={block} onChange={onChange} />;
  }
}

export function BlockImageField({
  block,
  onChange,
}: {
  block: Extract<PageBlock, { type: "image" }>;
  onChange: (b: PageBlock) => void;
}) {
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
    const result = await uploadPageImage(formData);
    if ("error" in result) {
      setStatus("error");
      setError(result.error);
      return;
    }
    onChange({ ...block, url: result.url });
    setStatus("idle");
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-4">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-navy/10 bg-navy/[0.02]">
          {block.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={block.url} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-center text-[10px] text-navy/30">Нет фото</span>
          )}
        </div>
        <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-full border border-navy/15 px-3.5 py-1.5 text-xs font-medium text-navy transition hover:bg-navy/5">
          {status === "uploading" ? "Загружаем…" : block.url ? "Заменить" : "Загрузить"}
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
      <input
        value={block.alt}
        onChange={(e) => onChange({ ...block, alt: e.target.value })}
        placeholder="Alt-текст (описание изображения)"
        className="input"
      />
    </div>
  );
}

export function StatListFields({
  block,
  onChange,
}: {
  block: Extract<PageBlock, { type: "stat_list" }>;
  onChange: (b: PageBlock) => void;
}) {
  function updateItem(i: number, key: "label" | "value", value: string) {
    const items = block.items.map((item, idx) =>
      idx === i ? { ...item, [key]: value } : item
    );
    onChange({ ...block, items });
  }
  function addItem() {
    onChange({ ...block, items: [...block.items, { label: "", value: "" }] });
  }
  function removeItem(i: number) {
    onChange({ ...block, items: block.items.filter((_, idx) => idx !== i) });
  }

  return (
    <div className="flex flex-col gap-2">
      {block.items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            value={item.value}
            onChange={(e) => updateItem(i, "value", e.target.value)}
            placeholder="Значение"
            className="input"
          />
          <input
            value={item.label}
            onChange={(e) => updateItem(i, "label", e.target.value)}
            placeholder="Подпись"
            className="input"
          />
          <IconButton onClick={() => removeItem(i)} label="Удалить">
            <TrashIcon className="h-3.5 w-3.5" />
          </IconButton>
        </div>
      ))}
      <button
        type="button"
        onClick={addItem}
        className="inline-flex w-fit items-center gap-1 rounded-full bg-navy/5 px-2.5 py-1 text-xs font-medium text-navy/60 transition hover:bg-navy/10"
      >
        <PlusIcon className="h-3 w-3" />
        Добавить пункт
      </button>
    </div>
  );
}
