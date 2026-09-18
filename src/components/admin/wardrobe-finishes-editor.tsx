"use client";

import { useState } from "react";
import { PlusIcon, TrashIcon } from "./icons";
import type { WardrobeFinish } from "@/lib/data";

interface FinishRow {
  label: string;
  ral: string;
  hex: string;
}

function toRows(finishes: WardrobeFinish[]): FinishRow[] {
  return finishes.map((f) => ({
    label: f.label,
    ral: f.ral ?? "",
    hex: f.hex,
  }));
}

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

export function WardrobeFinishesEditor({
  name,
  initialFinishes,
}: {
  name: string;
  initialFinishes: WardrobeFinish[];
}) {
  const [rows, setRows] = useState<FinishRow[]>(() => toRows(initialFinishes));

  function update(index: number, patch: Partial<FinishRow>) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, { label: "", ral: "", hex: "#ffffff" }]);
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-3">
      <input type="hidden" name={name} value={JSON.stringify(rows)} />
      {rows.map((row, i) => {
        const hexValid = HEX_RE.test(row.hex);
        return (
          <div
            key={i}
            className="flex flex-wrap items-center gap-3 rounded-lg border border-navy/10 p-3"
          >
            <label className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-navy/15">
              <input
                type="color"
                value={hexValid ? row.hex : "#ffffff"}
                onChange={(e) => update(i, { hex: e.target.value })}
                className="absolute -left-1 -top-1 h-11 w-11 cursor-pointer border-0 p-0"
                aria-label="Цвет"
              />
            </label>
            <input
              value={row.label}
              onChange={(e) => update(i, { label: e.target.value })}
              placeholder="Название, напр. Белый матовый"
              className="input min-w-[10rem] flex-1"
            />
            <input
              value={row.ral}
              onChange={(e) => update(i, { ral: e.target.value })}
              placeholder="RAL (необязательно)"
              className="input w-36"
            />
            <input
              value={row.hex}
              onChange={(e) => update(i, { hex: e.target.value })}
              placeholder="#RRGGBB"
              className={`input w-28 font-mono text-xs ${
                hexValid ? "" : "border-red-300 text-red-600"
              }`}
            />
            <button
              type="button"
              onClick={() => removeRow(i)}
              className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-navy/40 transition hover:bg-red-50 hover:text-red-600"
              aria-label="Удалить отделку"
            >
              <TrashIcon />
            </button>
          </div>
        );
      })}
      <button
        type="button"
        onClick={addRow}
        className="flex w-fit items-center gap-1.5 rounded-full border border-navy/15 px-4 py-2 text-xs font-medium text-navy transition hover:bg-navy/5"
      >
        <PlusIcon />
        Добавить отделку
      </button>
    </div>
  );
}
