"use client";

import { useState } from "react";

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
          className="text-xs font-medium text-sage-dark hover:underline"
        >
          + Добавить
        </button>
      </div>
      <input type="hidden" name={name} value={serialized} />
      {rows.length === 0 && (
        <p className="mt-2 text-xs text-navy/40">Пока пусто.</p>
      )}
      <div className="mt-2 flex flex-col gap-2">
        {rows.map((row, i) => (
          <div key={i} className="flex items-center gap-2">
            {fields.map((f) => (
              <input
                key={f.key}
                type={f.type === "number" ? "number" : "text"}
                value={row[f.key] ?? ""}
                onChange={(e) => updateCell(i, f.key, e.target.value)}
                placeholder={f.placeholder ?? f.label}
                className="w-full min-w-0 flex-1 rounded-md border border-navy/15 px-2 py-1.5 text-sm"
              />
            ))}
            <button
              type="button"
              onClick={() => removeRow(i)}
              className="shrink-0 text-xs font-medium text-navy/40 hover:text-navy"
            >
              Удалить
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
