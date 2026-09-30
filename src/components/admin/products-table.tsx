"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { bulkUpdateProducts, duplicateProduct } from "@/lib/admin-actions";
import { ArrowRightIcon, CopyIcon } from "./icons";

export interface ProductRow {
  id: string;
  name: string;
  imageUrl: string | null;
  priceLabel: string;
  discountPercent: number | null;
  isFeatured: boolean;
  isPublished: boolean;
}

export interface ProductGroup {
  category: { id: string; name: string };
  items: ProductRow[];
}

export function ProductsTable({
  groups,
  categories,
}: {
  groups: ProductGroup[];
  categories: { id: string; name: string }[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState(false);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleGroup(items: ProductRow[]) {
    setSelected((prev) => {
      const next = new Set(prev);
      const all = items.every((i) => next.has(i.id));
      for (const i of items) {
        if (all) next.delete(i.id);
        else next.add(i.id);
      }
      return next;
    });
  }

  async function run(formData: FormData) {
    setPending(true);
    for (const id of selected) formData.append("ids", id);
    await bulkUpdateProducts(formData);
    setSelected(new Set());
    setPending(false);
  }

  return (
    <div className="mt-6 flex flex-col gap-6 pb-24">
      {groups.map(({ category, items }) => {
        const allChecked = items.every((i) => selected.has(i.id));
        return (
          <section key={category.id} className="overflow-hidden rounded-[1.5rem] border border-navy/[0.07] bg-white">
            <div className="flex items-center gap-3 border-b border-navy/[0.07] px-5 py-3.5">
              <input
                type="checkbox"
                checked={allChecked}
                onChange={() => toggleGroup(items)}
                aria-label={`Выбрать все: ${category.name}`}
                className="h-4 w-4 accent-navy"
              />
              <h2 className="font-heading text-sm font-bold text-navy">{category.name}</h2>
              <span className="rounded-full bg-navy/5 px-2 py-0.5 text-[11px] font-semibold text-navy/55">{items.length}</span>
            </div>
            <ul className="divide-y divide-navy/5">
              {items.map((p) => (
                <li
                  key={p.id}
                  className={`group flex flex-wrap items-center gap-3 px-5 py-3 transition hover:bg-cream-light/60 sm:flex-nowrap ${
                    selected.has(p.id) ? "bg-cream-light/80" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(p.id)}
                    onChange={() => toggle(p.id)}
                    aria-label={`Выбрать ${p.name}`}
                    className="h-4 w-4 shrink-0 accent-navy"
                  />
                  <Link href={`/admin/products/${p.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                    <span className={`relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-cream-light ${p.isPublished ? "" : "opacity-40 grayscale"}`}>
                      {p.imageUrl ? (
                        <Image src={p.imageUrl} alt="" fill sizes="96px" className="object-cover" />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-sm font-bold text-navy/40">
                          {p.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className={`block truncate font-semibold ${p.isPublished ? "text-navy" : "text-navy/45"} group-hover:text-clay`}>
                        {p.name}
                      </span>
                      <span className="mt-0.5 flex flex-wrap gap-1.5">
                        {!p.isPublished && (
                          <span className="rounded-full bg-navy/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-navy/60">
                            скрыт
                          </span>
                        )}
                        {p.isFeatured && (
                          <span className="rounded-full bg-cream px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent-dark">
                            популярное
                          </span>
                        )}
                      </span>
                    </span>
                  </Link>
                  <span className="whitespace-nowrap text-sm text-navy/65">
                    {p.priceLabel}
                    {p.discountPercent ? (
                      <span className="ml-1.5 rounded-full bg-clay-light px-1.5 py-0.5 text-[10px] font-bold text-clay">
                        −{p.discountPercent}%
                      </span>
                    ) : null}
                  </span>
                  <span className="flex items-center gap-1">
                    <form action={duplicateProduct.bind(null, p.id)}>
                      <button
                        type="submit"
                        title="Дублировать"
                        aria-label="Дублировать"
                        className="rounded-full p-2 text-navy/40 transition hover:bg-navy/5 hover:text-navy"
                      >
                        <CopyIcon className="h-4 w-4" />
                      </button>
                    </form>
                    <Link
                      href={`/admin/products/${p.id}`}
                      aria-label="Редактировать"
                      className="rounded-full p-2 text-navy/40 transition hover:bg-navy hover:text-white"
                    >
                      <ArrowRightIcon className="h-4 w-4" />
                    </Link>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      {selected.size > 0 && (
        <form
          action={run}
          className="fixed inset-x-4 bottom-4 z-40 mx-auto flex max-w-4xl animate-fade-up flex-wrap items-center gap-2 rounded-2xl bg-navy p-3 text-white shadow-2xl shadow-navy/30 md:left-72"
        >
          <span className="px-2 text-sm font-semibold">Выбрано: {selected.size}</span>
          {[
            ["publish", "Показать на сайте"],
            ["hide", "Скрыть"],
            ["feature", "В популярные"],
            ["unfeature", "Убрать из популярных"],
          ].map(([op, label]) => (
            <button
              key={op}
              type="submit"
              name="op"
              value={op}
              disabled={pending}
              className="rounded-full bg-white/10 px-3.5 py-2 text-xs font-semibold transition hover:bg-white hover:text-navy disabled:opacity-50"
            >
              {label}
            </button>
          ))}
          <span className="flex items-center gap-1.5">
            <select name="categoryId" defaultValue="" className="rounded-full bg-white/10 px-3 py-2 text-xs font-semibold text-white outline-none [&>option]:text-navy">
              <option value="">Перенести в…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              name="op"
              value="move"
              disabled={pending}
              className="rounded-full bg-clay px-3.5 py-2 text-xs font-semibold transition hover:bg-white hover:text-navy disabled:opacity-50"
            >
              Перенести
            </button>
          </span>
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="ml-auto rounded-full px-3 py-2 text-xs font-semibold text-cream/70 hover:text-white"
          >
            Отменить
          </button>
        </form>
      )}
    </div>
  );
}
