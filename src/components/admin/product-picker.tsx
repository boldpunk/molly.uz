"use client";

import { useState } from "react";
import { PlusIcon, TrashIcon } from "./icons";

export interface PickableProduct {
  id: string;
  name: string;
  categorySlug: string;
}

export function ProductPicker({
  name,
  products,
}: {
  name: string;
  products: PickableProduct[];
}) {
  const [rows, setRows] = useState<string[]>([]);

  function addRow() {
    setRows((prev) => [...prev, products[0]?.id ?? ""]);
  }
  function updateRow(i: number, value: string) {
    setRows((prev) => prev.map((v, idx) => (idx === i ? value : v)));
  }
  function removeRow(i: number) {
    setRows((prev) => prev.filter((_, idx) => idx !== i));
  }

  const serialized = JSON.stringify(rows.filter(Boolean));

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="font-medium text-navy">Товары</span>
        <button
          type="button"
          onClick={addRow}
          className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-1 text-xs font-semibold text-accent-dark transition hover:bg-accent/25"
        >
          <PlusIcon className="h-3 w-3" />
          Добавить товар
        </button>
      </div>
      <input type="hidden" name={name} value={serialized} />
      {rows.length === 0 ? (
        <p className="mt-2 rounded-lg border border-dashed border-navy/15 px-3 py-3 text-center text-xs text-navy/40">
          Без товаров
        </p>
      ) : (
        <div className="mt-2 flex flex-col gap-2">
          {rows.map((productId, i) => (
            <div key={i} className="flex items-center gap-2">
              <select
                value={productId}
                onChange={(e) => updateRow(i, e.target.value)}
                className="input"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => removeRow(i)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-navy/30 transition hover:bg-red-50 hover:text-red-500"
                aria-label="Удалить"
              >
                <TrashIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
