"use client";

import { useState } from "react";
import { PlusIcon, TrashIcon } from "./icons";

type FieldType = "text" | "number";

interface FieldDef {
  key: string;
  label: string;
  placeholder?: string;
  type?: FieldType;
}

export type Row = Record<string, string | number>;

export function DynamicListField({
  name,
  label,
  fields,
  initialItems,
}: {
  name: string;
  label: string;
  fields: FieldDef[];
  initialItems: Row[];
}) {
  const [rows, setRows] = useState<Row[]>(initialItems);

  function updateCell(index: number, key: string, value: string) {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [key]: value } : row))
    );
  }

  function addRow() {
    const blank: Row = {};
    fields.forEach((f) => (blank[f.key] = f.type === "number" ? 0 : ""));
    setRows((prev) => [...prev, blank]);
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  const serialized = JSON.stringify(
    rows.map((row) => {
      const out: Row = {};
      fields.forEach((f) => {
        out[f.key] =
          f.type === "number" ? Number(row[f.key]) || 0 : row[f.key] ?? "";
      });
      return out;
    })
  );

  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-navy">{label}</h3>
        <button
          type="button"
          onClick={addRow}
          className="inline-flex items-center gap-1 rounded-full bg-sage/15 px-2.5 py-1 text-xs font-semibold text-sage-dark transition hover:bg-sage/25"
        >
          <PlusIcon className="h-3 w-3" />
          Добавить
        </button>
      </div>
      <input type="hidden" name={name} value={serialized} />
      {rows.length === 0 ? (
        <p className="mt-2 rounded-lg border border-dashed border-navy/15 px-3 py-3 text-center text-xs text-navy/40">
          Пока пусто.
        </p>
      ) : (
        <div className="mt-2 overflow-hidden rounded-lg border border-navy/10">
          {fields.length > 1 && (
            <div
              className="hidden gap-2 bg-navy/[0.03] px-3 py-1.5 text-[11px] font-medium uppercase tracking-wide text-navy/40 sm:grid"
              style={{ gridTemplateColumns: `repeat(${fields.length}, 1fr) 28px` }}
            >
              {fields.map((f) => (
                <span key={f.key}>{f.label}</span>
              ))}
              <span />
            </div>
          )}
          <div className="flex flex-col divide-y divide-navy/5">
            {rows.map((row, i) => (
              <div
                key={i}
                className="grid grid-cols-1 items-center gap-2 bg-white p-2 sm:gap-2"
                style={{
                  gridTemplateColumns: `repeat(${fields.length}, 1fr) 28px`,
                }}
              >
                {fields.map((f) => (
                  <input
                    key={f.key}
                    type={f.type === "number" ? "number" : "text"}
                    value={row[f.key] ?? ""}
                    onChange={(e) => updateCell(i, f.key, e.target.value)}
                    placeholder={f.placeholder ?? f.label}
                    className="w-full min-w-0 rounded-md border border-navy/10 bg-navy/[0.015] px-2.5 py-1.5 text-sm outline-none transition focus:border-navy/30 focus:bg-white"
                  />
                ))}
                <button
                  type="button"
                  onClick={() => removeRow(i)}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-navy/30 transition hover:bg-red-50 hover:text-red-500"
                  aria-label="Удалить"
                >
                  <TrashIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
