"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Category, Product } from "@/lib/types";
import { ProductCard } from "@/components/product-card";
import { getCategoryIcon, FurnitureIcon } from "@/components/icons/categories";

type SortKey = "default" | "price-asc" | "price-desc" | "name";

function priceOf(p: Product) {
  if (p.pricingMode === "per_metre" && p.hardwareOptions) {
    return Math.min(...p.hardwareOptions.map((h) => h.pricePerMetre));
  }
  return null;
}

export function CatalogView({
  category,
  categories: allCategories,
  products,
}: {
  category: Category | null;
  categories: Category[];
  products: Product[];
}) {
  const [colour, setColour] = useState<string | "all">("all");
  const [hardware, setHardware] = useState<string | "all">("all");
  const [sort, setSort] = useState<SortKey>("default");

  const colourOptions = useMemo(() => {
    const map = new Map<string, string>();
    products.forEach((p) =>
      p.colourOptions?.forEach((c) => map.set(c.id, c.label))
    );
    return Array.from(map.entries());
  }, [products]);

  const hardwareOptions = useMemo(() => {
    const map = new Map<string, string>();
    products.forEach((p) =>
      p.hardwareOptions?.forEach((h) => map.set(h.id, h.label))
    );
    return Array.from(map.entries());
  }, [products]);

  const filtered = useMemo(() => {
    let list = products;
    if (colour !== "all") {
      list = list.filter((p) => p.colourOptions?.some((c) => c.id === colour));
    }
    if (hardware !== "all") {
      list = list.filter((p) =>
        p.hardwareOptions?.some((h) => h.id === hardware)
      );
    }
    const sorted = [...list];
    if (sort === "name") {
      sorted.sort((a, b) => a.name.localeCompare(b.name, "ru"));
    } else if (sort === "price-asc" || sort === "price-desc") {
      sorted.sort((a, b) => {
        const pa = priceOf(a);
        const pb = priceOf(b);
        if (pa === null && pb === null) return 0;
        if (pa === null) return 1;
        if (pb === null) return -1;
        return sort === "price-asc" ? pa - pb : pb - pa;
      });
    }
    return sorted;
  }, [products, colour, hardware, sort]);

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <nav className="text-xs text-navy/50">
        <Link href="/" className="hover:underline">
          Главная
        </Link>{" "}
        /{" "}
        <span className="text-navy">
          {category ? category.name : "Все продукты"}
        </span>
      </nav>

      {/* Category tabs */}
      <div className="mt-4 flex flex-wrap gap-2 border-b border-navy/10 pb-4">
        <Link
          href="/catalog"
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
            !category
              ? "bg-navy text-white"
              : "bg-navy/5 text-navy/70 hover:bg-navy/10"
          }`}
        >
          <FurnitureIcon
            className={`h-4 w-4 ${!category ? "text-white" : "text-navy/40"}`}
          />
          Все продукты
        </Link>
        {allCategories.map((cat) => {
          const Icon = getCategoryIcon(cat.slug);
          const active = cat.id === category?.id;
          return (
            <Link
              key={cat.id}
              href={`/catalog/${cat.slug}`}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                active
                  ? "bg-navy text-white"
                  : "bg-navy/5 text-navy/70 hover:bg-navy/10"
              }`}
            >
              <Icon
                className={`h-4 w-4 ${active ? "text-white" : "text-navy/40"}`}
              />
              {cat.name}
            </Link>
          );
        })}
      </div>

      <h1 className="font-heading mt-6 text-2xl font-bold text-navy">
        {category ? category.name : "Все продукты"}
      </h1>

      {category?.isPlaceholder ? (
        <div className="mt-8 rounded-xl border border-dashed border-navy/20 bg-navy/[0.02] px-6 py-16 text-center">
          <p className="font-heading text-lg font-semibold text-navy">
            Каталог пока наполняется
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-navy/60">
            У нас пока нет товаров в этой категории — мы честно показываем
            это, а не выдумываем модели. Загляните позже или подпишитесь,
            чтобы узнать о новых поступлениях первыми.
          </p>
          <Link
            href="/catalog/kuhonnaya-mebel"
            className="mt-6 inline-block rounded-full bg-navy px-6 py-3 text-sm font-semibold text-white hover:bg-navy/90"
          >
            Смотреть кухни
          </Link>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-8 md:flex-row">
          {/* Filters — accordion on mobile, always-open sidebar on desktop */}
          <aside className="shrink-0 md:w-56">
            <details className="group rounded-lg border border-navy/10 bg-white p-4 md:hidden">
              <summary className="cursor-pointer text-sm font-semibold text-navy">
                Фильтры
              </summary>
              <div className="mt-4 flex flex-col gap-6">
                <FiltersBody
                  hardwareOptions={hardwareOptions}
                  colourOptions={colourOptions}
                  hardware={hardware}
                  colour={colour}
                  setHardware={setHardware}
                  setColour={setColour}
                  showKitchenNote={category?.filterKind === "kitchen"}
                />
              </div>
            </details>
            <div className="hidden md:flex md:flex-col md:gap-6">
              <FiltersBody
                hardwareOptions={hardwareOptions}
                colourOptions={colourOptions}
                hardware={hardware}
                colour={colour}
                setHardware={setHardware}
                setColour={setColour}
                showKitchenNote={category?.filterKind === "kitchen"}
              />
            </div>
          </aside>

          {/* Results */}
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-sm text-navy/60">
                {filtered.length}{" "}
                {filtered.length === 1 ? "модель" : "моделей"}
              </span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="rounded-md border border-navy/15 bg-white px-3 py-1.5 text-sm text-navy"
              >
                <option value="default">По умолчанию</option>
                <option value="name">По названию</option>
                <option value="price-asc">Сначала дешевле</option>
                <option value="price-desc">Сначала дороже</option>
              </select>
            </div>
            {filtered.length === 0 ? (
              <p className="mt-10 text-center text-sm text-navy/50">
                Ничего не найдено по этим фильтрам.
              </p>
            ) : (
              <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3">
                {filtered.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function FilterOption({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-3 py-1.5 text-left text-sm transition ${
        active ? "bg-sage/25 font-medium text-navy" : "text-navy/60 hover:bg-navy/5"
      }`}
    >
      {label}
    </button>
  );
}

function FiltersBody({
  hardwareOptions,
  colourOptions,
  hardware,
  colour,
  setHardware,
  setColour,
  showKitchenNote,
}: {
  hardwareOptions: [string, string][];
  colourOptions: [string, string][];
  hardware: string;
  colour: string;
  setHardware: (id: string) => void;
  setColour: (id: string) => void;
  showKitchenNote: boolean;
}) {
  return (
    <>
      {hardwareOptions.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-navy/50">
            Фурнитура
          </h3>
          <div className="mt-2 flex flex-col gap-1">
            <FilterOption
              active={hardware === "all"}
              label="Все"
              onClick={() => setHardware("all")}
            />
            {hardwareOptions.map(([id, label]) => (
              <FilterOption
                key={id}
                active={hardware === id}
                label={label}
                onClick={() => setHardware(id)}
              />
            ))}
          </div>
        </div>
      )}
      {colourOptions.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-navy/50">
            Цвет / отделка
          </h3>
          <div className="mt-2 flex flex-col gap-1">
            <FilterOption
              active={colour === "all"}
              label="Все"
              onClick={() => setColour("all")}
            />
            {colourOptions.map(([id, label]) => (
              <FilterOption
                key={id}
                active={colour === id}
                label={label}
                onClick={() => setColour(id)}
              />
            ))}
          </div>
        </div>
      )}
      {showKitchenNote && (
        <p className="text-xs text-navy/50">
          Цена указана за погонный метр — итоговая стоимость зависит от
          ширины кухни.
        </p>
      )}
    </>
  );
}
