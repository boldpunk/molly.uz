"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Category, Product } from "@/lib/types";
import { formatSum } from "@/lib/format";
import { PlaceholderImage } from "@/components/placeholder-image";
import { ProductCard } from "@/components/product-card";
import { useRequestList } from "@/lib/request-list-context";

const MIN_WIDTH = 1.5;
const MAX_WIDTH = 8;
const DEFAULT_WIDTH = 3;

export function ProductDetail({
  category,
  product,
  related,
}: {
  category: Category;
  product: Product;
  related: Product[];
}) {
  const router = useRouter();
  const { addItem } = useRequestList();
  const [hardwareId, setHardwareId] = useState(
    product.hardwareOptions?.[0]?.id
  );
  const [colourId, setColourId] = useState(product.colourOptions?.[0]?.id);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [tab, setTab] = useState<"description" | "specs" | "delivery">(
    "description"
  );
  const [submitted, setSubmitted] = useState(false);

  const isConfigurable = product.pricingMode === "per_metre";

  const hardware = product.hardwareOptions?.find((h) => h.id === hardwareId);
  const colour = product.colourOptions?.find((c) => c.id === colourId);

  const estimate = useMemo(() => {
    if (!isConfigurable || !hardware) return null;
    return Math.round(hardware.pricePerMetre * width);
  }, [isConfigurable, hardware, width]);

  function handleAddToRequest() {
    addItem({
      productId: product.id,
      productName: product.name,
      categorySlug: category.slug,
      productSlug: product.slug,
      hardwareId: hardware?.id,
      hardwareLabel: hardware?.label,
      colourId: colour?.id,
      colourLabel: colour?.label,
      widthMetres: isConfigurable ? width : undefined,
      estimate: estimate ?? undefined,
    });
    setSubmitted(true);
    setTimeout(() => router.push("/request"), 600);
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <nav className="text-xs text-navy/50">
        <Link href="/" className="hover:underline">
          Главная
        </Link>{" "}
        /{" "}
        <Link href={`/catalog/${category.slug}`} className="hover:underline">
          {category.name}
        </Link>{" "}
        / <span className="text-navy">{product.name}</span>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        {/* Gallery */}
        <div className="flex flex-col gap-3">
          <PlaceholderImage label={product.name} aspect="aspect-[4/3]" />
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <PlaceholderImage
                key={i}
                label="Ракурс"
                aspect="aspect-square"
              />
            ))}
          </div>
        </div>

        {/* Buy box — appears before description on mobile too, since it's DOM-first */}
        <div>
          <h1 className="font-heading text-2xl font-bold text-navy md:text-3xl">
            {product.name}
          </h1>
          <p className="mt-1 text-sm text-navy/60">{product.specLine}</p>

          {isConfigurable ? (
            <div className="mt-6 flex flex-col gap-6 rounded-xl border border-navy/10 bg-white p-5">
              {product.hardwareOptions && (
                <div>
                  <h3 className="text-sm font-semibold text-navy">
                    Фурнитура
                  </h3>
                  <div className="mt-2 flex gap-2">
                    {product.hardwareOptions.map((h) => (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => setHardwareId(h.id)}
                        className={`rounded-lg border px-4 py-2 text-sm transition ${
                          hardwareId === h.id
                            ? "border-sage-dark bg-sage/20 font-medium text-navy"
                            : "border-navy/15 text-navy/70 hover:bg-navy/5"
                        }`}
                      >
                        {h.label}
                        <span className="block text-xs text-navy/50">
                          {formatSum(h.pricePerMetre)} / пог.м
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {product.colourOptions && (
                <div>
                  <h3 className="text-sm font-semibold text-navy">
                    Цвет фасада
                  </h3>
                  <div className="mt-2 flex gap-2">
                    {product.colourOptions.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setColourId(c.id)}
                        title={c.label}
                        style={{ backgroundColor: c.swatch }}
                        className={`h-9 w-9 rounded-full border-2 transition ${
                          colourId === c.id
                            ? "border-sage-dark"
                            : "border-transparent hover:border-navy/20"
                        }`}
                      />
                    ))}
                  </div>
                  {colour && (
                    <p className="mt-1 text-xs text-navy/50">{colour.label}</p>
                  )}
                </div>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-navy">
                    Ширина (ширина без ограничений — под ваше помещение)
                  </h3>
                  <span className="text-sm font-medium text-navy">
                    {width.toFixed(1)} м
                  </span>
                </div>
                <input
                  type="range"
                  min={MIN_WIDTH}
                  max={MAX_WIDTH}
                  step={0.1}
                  value={width}
                  onChange={(e) => setWidth(parseFloat(e.target.value))}
                  className="mt-2 w-full accent-sage-dark"
                />
                <input
                  type="number"
                  min={MIN_WIDTH}
                  step={0.1}
                  value={width}
                  onChange={(e) =>
                    setWidth(
                      Math.max(MIN_WIDTH, parseFloat(e.target.value) || MIN_WIDTH)
                    )
                  }
                  className="mt-2 w-28 rounded-md border border-navy/15 px-2 py-1 text-sm"
                />
              </div>

              <div className="border-t border-navy/10 pt-4">
                <p className="text-xs uppercase tracking-wide text-navy/50">
                  Примерная стоимость
                </p>
                <p className="font-heading text-2xl font-bold text-navy">
                  {estimate !== null ? formatSum(estimate) : "—"}
                </p>
                <p className="mt-1 text-xs text-navy/50">
                  Это предварительная оценка. Точная цена подтверждается
                  после выезда замерщика.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddToRequest}
                className="w-full rounded-full bg-navy px-6 py-3 text-sm font-semibold text-white hover:bg-navy/90"
              >
                {submitted ? "Добавлено ✓" : "Оставить заявку на замер"}
              </button>
            </div>
          ) : (
            <div className="mt-6 flex flex-col gap-4 rounded-xl border border-navy/10 bg-white p-5">
              {product.colourOptions && product.colourOptions.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-navy">
                    Отделка
                  </h3>
                  <div className="mt-2 flex gap-2">
                    {product.colourOptions.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setColourId(c.id)}
                        title={c.label}
                        style={{ backgroundColor: c.swatch }}
                        className={`h-9 w-9 rounded-full border-2 transition ${
                          colourId === c.id
                            ? "border-sage-dark"
                            : "border-transparent hover:border-navy/20"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
              <span className="inline-block w-fit rounded-full bg-sage/15 px-3 py-1 text-xs font-semibold text-sage-dark">
                Цена по запросу
              </span>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleAddToRequest}
                  className="rounded-full bg-navy px-6 py-3 text-sm font-semibold text-white hover:bg-navy/90"
                >
                  {submitted ? "Добавлено ✓" : "Узнать цену"}
                </button>
                <a
                  href="https://t.me/mollyhome"
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-navy/20 px-6 py-3 text-sm font-semibold text-navy hover:bg-navy/5"
                >
                  Написать в Telegram
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-12">
        <div className="flex gap-6 border-b border-navy/10">
          {(
            [
              ["description", "Описание"],
              ["specs", "Характеристики"],
              ["delivery", "Доставка и оплата"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`-mb-px border-b-2 pb-3 text-sm font-medium transition ${
                tab === key
                  ? "border-navy text-navy"
                  : "border-transparent text-navy/50 hover:text-navy"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="py-6 text-sm text-navy/70">
          {tab === "description" && <p>{product.description}</p>}
          {tab === "specs" && (
            <table className="w-full max-w-md border-collapse text-sm">
              <tbody>
                {product.attributes.map((attr) => (
                  <tr key={attr.key} className="border-b border-navy/10">
                    <td className="py-2 pr-4 text-navy/50">{attr.key}</td>
                    <td className="py-2 font-medium text-navy">
                      {attr.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {tab === "delivery" && (
            <p>
              Сроки доставки и условия оплаты уточняются менеджером после
              подтверждения заказа.
            </p>
          )}
        </div>
      </div>

      {/* Related products */}
      {related.length > 0 && (
        <div className="mt-12">
          <h2 className="font-heading text-xl font-bold text-navy">
            Похожие модели
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
