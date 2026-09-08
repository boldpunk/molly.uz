"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Category, Product } from "@/lib/types";
import { formatSum } from "@/lib/format";
import { PlaceholderImage } from "@/components/placeholder-image";
import { ProductCard } from "@/components/product-card";
import { useRequestList } from "@/lib/request-list-context";
import { getHardwareBrandBadge } from "@/lib/hardware-brands";
import { SITE_URL } from "@/lib/site";
import { FavouriteButton } from "@/components/favourite-button";
import { ImageLightbox } from "@/components/image-lightbox";

const MIN_WIDTH = 2;
const MAX_WIDTH = 15;
const DEFAULT_WIDTH = 3;

export function ProductDetail({
  category,
  product,
  related,
  initialIsFavourite,
}: {
  category: Category;
  product: Product;
  related: Product[];
  initialIsFavourite: boolean;
}) {
  const router = useRouter();
  const { addItem } = useRequestList();
  const [hardwareId, setHardwareId] = useState(
    product.hardwareOptions?.[0]?.id
  );
  const [colourId, setColourId] = useState(product.colourOptions?.[0]?.id);
  const galleryImages = [product.imageUrl, ...product.galleryUrls].filter(
    (url): url is string => Boolean(url)
  );
  const [activeImage, setActiveImage] = useState(galleryImages[0]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [widthText, setWidthText] = useState(String(DEFAULT_WIDTH));
  const [tab, setTab] = useState<"description" | "specs" | "delivery">(
    "description"
  );
  const [submitted, setSubmitted] = useState(false);

  const isConfigurable = product.pricingMode === "per_metre";

  const parsedWidthText = parseFloat(widthText);
  const widthBelowMin =
    !Number.isNaN(parsedWidthText) && parsedWidthText < MIN_WIDTH;

  function handleWidthTextChange(raw: string) {
    setWidthText(raw);
    const parsed = parseFloat(raw);
    if (!Number.isNaN(parsed) && parsed >= MIN_WIDTH) {
      setWidth(parsed);
    }
  }

  function handleWidthSliderChange(raw: string) {
    const parsed = parseFloat(raw);
    setWidth(parsed);
    setWidthText(String(parsed));
  }

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

  const productJsonLd =
    isConfigurable && hardware
      ? {
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          description: product.specLine || product.description || undefined,
          image: product.imageUrl || undefined,
          url: `${SITE_URL}/catalog/${category.slug}/${product.slug}`,
          offers: {
            "@type": "Offer",
            priceCurrency: "UZS",
            price: hardware.pricePerMetre,
            availability: "https://schema.org/InStock",
            url: `${SITE_URL}/catalog/${category.slug}/${product.slug}`,
          },
        }
      : null;

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      {productJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
        />
      )}
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
          {activeImage ? (
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              className="aspect-[4/3] w-full cursor-zoom-in overflow-hidden rounded-lg bg-navy/[0.03]"
              aria-label="Открыть фото на весь экран"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeImage}
                alt={product.name}
                className="h-full w-full object-contain"
              />
            </button>
          ) : (
            <PlaceholderImage label={product.name} aspect="aspect-[4/3]" />
          )}
          {lightboxOpen && activeImage && (
            <ImageLightbox
              src={activeImage}
              alt={product.name}
              onClose={() => setLightboxOpen(false)}
            />
          )}
          {galleryImages.length > 1 ? (
            <div className="grid grid-cols-4 gap-3">
              {galleryImages.map((url) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setActiveImage(url)}
                  className={`overflow-hidden rounded-lg border-2 transition ${
                    activeImage === url
                      ? "border-sage-dark"
                      : "border-transparent hover:border-navy/15"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt=""
                    className="aspect-square w-full object-cover"
                  />
                </button>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <PlaceholderImage
                  key={i}
                  label="Ракурс"
                  aspect="aspect-square"
                />
              ))}
            </div>
          )}
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
                  <div className="mt-2 flex flex-wrap gap-2">
                    {product.hardwareOptions.map((h) => {
                      const badge = getHardwareBrandBadge(h.id, h.label);
                      return (
                        <button
                          key={h.id}
                          type="button"
                          onClick={() => setHardwareId(h.id)}
                          className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition ${
                            hardwareId === h.id
                              ? "border-sage-dark bg-sage/20 font-medium text-navy"
                              : "border-navy/15 text-navy/70 hover:bg-navy/5"
                          }`}
                        >
                          <span
                            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[8px] font-bold"
                            style={{ backgroundColor: badge.bg, color: badge.fg }}
                          >
                            {badge.letter}
                          </span>
                          <span className="text-left">
                            {h.label}
                            <span className="block text-xs text-navy/50">
                              {formatSum(h.pricePerMetre)} / пог.м
                            </span>
                          </span>
                        </button>
                      );
                    })}
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
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-navy">
                    Ширина (ширина без ограничений — под ваше помещение)
                  </h3>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <input
                      type="number"
                      inputMode="decimal"
                      step={0.01}
                      min={0}
                      value={widthText}
                      onChange={(e) => handleWidthTextChange(e.target.value)}
                      className={`w-20 rounded-md border px-2 py-1 text-right text-sm font-medium focus:outline-none ${
                        widthBelowMin
                          ? "border-red-600 text-red-600"
                          : "border-navy/15 text-navy"
                      }`}
                    />
                    <span className="text-sm font-medium text-navy">м</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={MIN_WIDTH}
                  max={MAX_WIDTH}
                  step={0.01}
                  value={width}
                  onChange={(e) => handleWidthSliderChange(e.target.value)}
                  className="mt-2 w-full accent-sage-dark"
                />
                <div className="mt-1 flex justify-between text-xs text-navy/40">
                  <span>{MIN_WIDTH} м</span>
                  <span>{MAX_WIDTH} м</span>
                </div>
                {widthBelowMin && (
                  <p className="mt-1.5 text-xs font-medium text-red-600">
                    Минимальная ширина — {MIN_WIDTH} м
                  </p>
                )}
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

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleAddToRequest}
                  className="flex-1 rounded-full bg-navy px-6 py-3 text-sm font-semibold text-white hover:bg-navy/90"
                >
                  {submitted ? "Добавлено ✓" : "Оставить заявку на замер"}
                </button>
                <FavouriteButton
                  productId={product.id}
                  productPath={`/catalog/${category.slug}/${product.slug}`}
                  initialIsFavourite={initialIsFavourite}
                />
              </div>
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
                <FavouriteButton
                  productId={product.id}
                  productPath={`/catalog/${category.slug}/${product.slug}`}
                  initialIsFavourite={initialIsFavourite}
                />
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
