"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Category, Product } from "@/lib/types";
import { formatSum } from "@/lib/format";
import { applyDiscount, getDisplayPrice } from "@/lib/pricing";
import { PlaceholderImage } from "@/components/placeholder-image";
import { ProductCard } from "@/components/product-card";
import { useRequestList } from "@/lib/request-list-context";
import { getHardwareBrandBadge } from "@/lib/hardware-brands";
import { SITE_URL } from "@/lib/site";
import { DEFAULT_COMPANY_NAME } from "@/lib/brand-config";
import { FavouriteButton } from "@/components/favourite-button";
import { ImageLightbox } from "@/components/image-lightbox";
import { PageBlocks } from "@/components/page-blocks";
import type { PageBlock } from "@/db/schema";
import { UspIcon } from "@/components/usp-icons";

const MIN_WIDTH = 2;
const MAX_WIDTH = 15;
const DEFAULT_WIDTH = 3;

export function ProductDetail({
  category,
  product,
  related,
  initialIsFavourite,
  deliveryBlocks,
}: {
  category: Category;
  product: Product;
  related: Product[];
  initialIsFavourite: boolean;
  deliveryBlocks: PageBlock[];
}) {
  const router = useRouter();
  const { addItem } = useRequestList();
  const [hardwareId, setHardwareId] = useState(
    product.hardwareOptions?.[0]?.id
  );
  const [colourId, setColourId] = useState(product.colourOptions?.[0]?.id);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [widthText, setWidthText] = useState(String(DEFAULT_WIDTH));
  const [tab, setTab] = useState<"description" | "specs" | "delivery">(
    "description"
  );
  const [submitted, setSubmitted] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const isConfigurable = product.pricingMode === "per_metre";
  const isFixedPrice = product.pricingMode === "fixed";

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

  // Colours with their own photoset (e.g. per-colour sofa renders) swap the
  // gallery when selected; otherwise the gallery stays the product's own.
  const galleryImages = useMemo(() => {
    const fromColour = colour?.imageUrl
      ? [colour.imageUrl, ...(colour.galleryUrls ?? [])]
      : [product.imageUrl, ...product.galleryUrls];
    return fromColour.filter((url): url is string => Boolean(url));
  }, [colour, product.imageUrl, product.galleryUrls]);

  const [activeImage, setActiveImage] = useState(galleryImages[0]);
  const [galleryForActiveImage, setGalleryForActiveImage] = useState(galleryImages);
  if (galleryForActiveImage !== galleryImages) {
    setGalleryForActiveImage(galleryImages);
    setActiveImage(galleryImages[0]);
  }

  const displayPrice = getDisplayPrice(product);

  const estimate = useMemo(() => {
    if (!isConfigurable || !hardware) return null;
    return Math.round(
      applyDiscount(hardware.pricePerMetre, product.discountPercent) * width
    );
  }, [isConfigurable, hardware, width, product.discountPercent]);
  const originalEstimate = useMemo(() => {
    if (!isConfigurable || !hardware || !product.discountPercent) return null;
    return Math.round(hardware.pricePerMetre * width);
  }, [isConfigurable, hardware, width, product.discountPercent]);

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
      estimate: (isConfigurable ? estimate : displayPrice?.amount) ?? undefined,
    });
    setSubmitted(true);
    setTimeout(() => router.push("/request"), 600);
  }

  const productUrl = `${SITE_URL}/catalog/${category.slug}/${product.slug}`;
  const offerPrice =
    isConfigurable && hardware
      ? applyDiscount(hardware.pricePerMetre, product.discountPercent)
      : isFixedPrice
        ? displayPrice?.amount
        : undefined;
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.specLine || product.description || undefined,
    image: product.imageUrl || undefined,
    url: productUrl,
    brand: { "@type": "Brand", name: DEFAULT_COMPANY_NAME },
    offers:
      offerPrice !== undefined
        ? {
            "@type": "Offer",
            priceCurrency: "UZS",
            price: offerPrice,
            availability: "https://schema.org/InStock",
            url: productUrl,
          }
        : {
            "@type": "Offer",
            availability: "https://schema.org/InStock",
            url: productUrl,
          },
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Главная", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: category.name,
        item: `${SITE_URL}/catalog/${category.slug}`,
      },
      { "@type": "ListItem", position: 3, name: product.name, item: productUrl },
    ],
  };

  const productPath = `/catalog/${category.slug}/${product.slug}`;
  const activeIndex = Math.max(0, galleryImages.indexOf(activeImage ?? ""));
  function stepImage(dir: -1 | 1) {
    if (galleryImages.length < 2) return;
    const next = (activeIndex + dir + galleryImages.length) % galleryImages.length;
    setActiveImage(galleryImages[next]);
  }

  const swatchPicker = (title: string) =>
    product.colourOptions && product.colourOptions.length > 0 ? (
      <div>
        <h3 className="text-sm font-semibold text-navy">
          {title}
          {colour && <span className="font-normal text-navy/50"> · {colour.label}</span>}
        </h3>
        <div className="mt-3 flex flex-wrap gap-3">
          {product.colourOptions.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setColourId(c.id)}
              title={c.label}
              aria-label={c.label}
              aria-pressed={colourId === c.id}
              className={`relative h-11 w-11 rounded-full p-1 transition duration-300 ${
                colourId === c.id
                  ? "ring-2 ring-navy ring-offset-2"
                  : "ring-1 ring-navy/15 hover:scale-110"
              }`}
            >
              <span
                className="block h-full w-full rounded-full shadow-inner"
                style={{ backgroundColor: c.swatch }}
              />
            </button>
          ))}
        </div>
      </div>
    ) : null;

  const favourite = (
    <FavouriteButton
      productId={product.id}
      productPath={productPath}
      initialIsFavourite={initialIsFavourite}
    />
  );

  const primaryLabel = submitted
    ? "Добавлено ✓"
    : isConfigurable
      ? "Оставить заявку на замер"
      : isFixedPrice
        ? "Оставить заявку"
        : "Узнать цену";

  return (
    <div className="mx-auto max-w-7xl px-6 pb-10 pt-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <nav className="flex flex-wrap items-center gap-1.5 text-xs text-navy/50">
        <Link href="/" className="transition hover:text-navy">
          Главная
        </Link>
        <span aria-hidden>/</span>
        <Link href={`/catalog/${category.slug}`} className="transition hover:text-navy">
          {category.name}
        </Link>
        <span aria-hidden>/</span>
        <span className="text-navy">{product.name}</span>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
        {/* Gallery */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div
            className="group relative overflow-hidden rounded-[2rem] bg-cream-light"
            onTouchStart={(e) => (touchStartX.current = e.touches[0].clientX)}
            onTouchEnd={(e) => {
              if (touchStartX.current === null) return;
              const dx = e.changedTouches[0].clientX - touchStartX.current;
              if (Math.abs(dx) > 40) stepImage(dx < 0 ? 1 : -1);
              touchStartX.current = null;
            }}
          >
            {activeImage ? (
              <button
                type="button"
                onClick={() => setLightboxOpen(true)}
                className="relative block aspect-[5/4] w-full cursor-zoom-in"
                aria-label="Открыть фото на весь экран"
              >
                <Image
                  key={activeImage}
                  src={activeImage}
                  alt={product.name}
                  fill
                  sizes="(min-width: 1024px) 55vw, 100vw"
                  priority
                  className="animate-fade-in object-contain"
                />
              </button>
            ) : (
              <PlaceholderImage label={product.name} aspect="aspect-[5/4]" className="rounded-none border-0" />
            )}

            {product.discountPercent ? (
              <span className="absolute left-5 top-5 rounded-full bg-clay px-3 py-1.5 text-xs font-bold text-white shadow">
                −{product.discountPercent}%
              </span>
            ) : null}

            {galleryImages.length > 1 && (
              <>
                {([-1, 1] as const).map((dir) => (
                  <button
                    key={dir}
                    type="button"
                    onClick={() => stepImage(dir)}
                    aria-label={dir < 0 ? "Предыдущее фото" : "Следующее фото"}
                    className={`absolute top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-navy shadow-lg backdrop-blur transition hover:bg-navy hover:text-white md:opacity-0 md:group-hover:opacity-100 ${
                      dir < 0 ? "left-4" : "right-4"
                    }`}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path
                        d={dir < 0 ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"}
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                ))}
                <span className="absolute bottom-4 right-4 rounded-full bg-navy/80 px-3 py-1 text-xs font-medium text-white backdrop-blur">
                  {activeIndex + 1} / {galleryImages.length}
                </span>
              </>
            )}
          </div>

          {lightboxOpen && activeImage && (
            <ImageLightbox
              src={activeImage}
              alt={product.name}
              onClose={() => setLightboxOpen(false)}
            />
          )}

          {galleryImages.length > 1 && (
            <div className="no-scrollbar mt-4 flex gap-3 overflow-x-auto pb-1">
              {galleryImages.map((url, i) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setActiveImage(url)}
                  aria-label={`Фото ${i + 1}`}
                  className={`relative aspect-square w-20 shrink-0 overflow-hidden rounded-2xl bg-cream-light transition duration-300 sm:w-24 ${
                    activeImage === url
                      ? "ring-2 ring-navy ring-offset-2"
                      : "opacity-60 hover:opacity-100"
                  }`}
                >
                  <Image
                    src={url}
                    alt=""
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Buy box */}
        <div className="flex flex-col">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/catalog/${category.slug}`}
              className="rounded-full bg-navy/5 px-3 py-1 text-xs font-medium text-navy/70 transition hover:bg-navy hover:text-white"
            >
              {category.name}
            </Link>
            {product.collection && (
              <span className="rounded-full bg-clay-light px-3 py-1 text-xs font-semibold uppercase tracking-wider text-clay">
                {product.collection}
              </span>
            )}
            {product.isFeatured && (
              <span className="rounded-full bg-navy px-3 py-1 text-xs font-semibold uppercase tracking-wider text-cream">
                Хит
              </span>
            )}
          </div>
          <h1 className="mt-4 font-heading text-3xl font-bold tracking-tight text-navy md:text-4xl">
            {product.name}
          </h1>
          {product.specLine && (
            <p className="mt-2 text-sm text-navy/60">{product.specLine}</p>
          )}

          <div className="mt-6 flex flex-col gap-6 rounded-[1.75rem] border border-navy/10 bg-white p-6 shadow-xl shadow-navy/[0.04]">
            {isConfigurable && product.hardwareOptions && (
              <div>
                <h3 className="text-sm font-semibold text-navy">Фурнитура</h3>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  {product.hardwareOptions.map((h) => {
                    const badge = getHardwareBrandBadge(h.id, h.label);
                    const active = hardwareId === h.id;
                    return (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => setHardwareId(h.id)}
                        aria-pressed={active}
                        className={`flex items-center gap-3 rounded-2xl border p-3 text-left text-sm transition duration-300 ${
                          active
                            ? "border-navy bg-navy text-white shadow-lg shadow-navy/20"
                            : "border-navy/15 text-navy hover:border-navy/40"
                        }`}
                      >
                        <span
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                          style={{ backgroundColor: badge.bg, color: badge.fg }}
                        >
                          {badge.letter}
                        </span>
                        <span>
                          <span className="block font-semibold">{h.label}</span>
                          <span className={`block text-xs ${active ? "text-white/70" : "text-navy/50"}`}>
                            {formatSum(applyDiscount(h.pricePerMetre, product.discountPercent))} / пог.м
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {swatchPicker(isConfigurable ? "Цвет фасада" : isFixedPrice ? "Цвет" : "Отделка")}

            {isConfigurable && (
              <div>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-navy">
                    Ширина кухни
                    <span className="block text-xs font-normal text-navy/50">
                      без ограничений — под ваше помещение
                    </span>
                  </h3>
                  <div className="flex shrink-0 items-center gap-1.5 rounded-xl border border-navy/15 px-3 py-1.5 focus-within:border-navy">
                    <input
                      type="number"
                      inputMode="decimal"
                      step={0.01}
                      min={0}
                      value={widthText}
                      onChange={(e) => handleWidthTextChange(e.target.value)}
                      aria-label="Ширина в метрах"
                      className={`w-14 bg-transparent text-right text-base font-semibold focus:outline-none ${
                        widthBelowMin ? "text-red-600" : "text-navy"
                      }`}
                    />
                    <span className="text-sm font-medium text-navy/60">м</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={MIN_WIDTH}
                  max={MAX_WIDTH}
                  step={0.01}
                  value={width}
                  onChange={(e) => handleWidthSliderChange(e.target.value)}
                  aria-label="Ширина"
                  className="mt-4 w-full accent-clay"
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
            )}

            {/* Price panel */}
            <div className="relative overflow-hidden rounded-2xl bg-navy p-5 text-white">
              <div aria-hidden className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-clay/30 blur-2xl" />
              <div className="relative flex items-center gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cream/70">
                  {isConfigurable ? "Примерная стоимость" : isFixedPrice ? "Цена" : "Стоимость"}
                </p>
                {(isConfigurable ? product.discountPercent : displayPrice?.discountPercent) ? (
                  <span className="rounded-full bg-clay px-2 py-0.5 text-[10px] font-bold">
                    −{isConfigurable ? product.discountPercent : displayPrice?.discountPercent}%
                  </span>
                ) : null}
              </div>
              <div className="relative mt-1 flex flex-wrap items-baseline gap-x-3">
                <p key={estimate ?? displayPrice?.amount ?? 0} className="animate-fade-in font-heading text-3xl font-bold">
                  {isConfigurable
                    ? estimate !== null
                      ? formatSum(estimate)
                      : "—"
                    : isFixedPrice
                      ? displayPrice
                        ? formatSum(displayPrice.amount)
                        : "—"
                      : "По запросу"}
                </p>
                {isConfigurable && originalEstimate !== null && (
                  <p className="text-sm text-white/50 line-through">{formatSum(originalEstimate)}</p>
                )}
                {isFixedPrice && displayPrice?.originalAmount && (
                  <p className="text-sm text-white/50 line-through">
                    {formatSum(displayPrice.originalAmount)}
                  </p>
                )}
              </div>
              <p className="relative mt-2 text-xs text-white/60">
                {isConfigurable
                  ? `${width} м × ${hardware ? hardware.label : ""}. Точная цена — после бесплатного замера.`
                  : isFixedPrice
                    ? "Доставка и сборка — по согласованию с менеджером."
                    : "Менеджер рассчитает стоимость под ваш размер и отделку."}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleAddToRequest}
                className="btn btn-primary py-3.5 sm:flex-1"
              >
                {primaryLabel}
              </button>
              {favourite}
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
              {category.slug === "garderoby" && (
                <Link href="/configurator/shkaf" className="font-medium text-clay underline-offset-4 hover:underline">
                  Собрать в конфигураторе →
                </Link>
              )}
              <a
                href="https://t.me/mollyhomeuzbot"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-navy/70 underline-offset-4 transition hover:text-navy hover:underline"
              >
                Задать вопрос в Telegram →
              </a>
            </div>
          </div>

          <ul className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
            {[
              { icon: "ruler", title: "Бесплатный замер", tone: "bg-clay-light text-clay" },
              { icon: "shield", title: "Своё производство", tone: "bg-sage-light text-sage" },
              { icon: "truck", title: "Доставка и монтаж", tone: "bg-cream text-accent-dark" },
            ].map((f) => (
              <li
                key={f.title}
                className="flex flex-col items-center gap-2 rounded-2xl border border-navy/10 p-3 text-center sm:flex-row sm:text-left"
              >
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${f.tone}`}>
                  <UspIcon icon={f.icon} className="h-4 w-4" />
                </span>
                <span className="text-xs font-semibold text-navy">{f.title}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Details */}
      <div className="mt-16">
        <div className="inline-flex max-w-full gap-1 overflow-x-auto rounded-full bg-navy/5 p-1 no-scrollbar">
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
              aria-pressed={tab === key}
              className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-medium transition duration-300 ${
                tab === key ? "bg-white text-navy shadow-md" : "text-navy/60 hover:text-navy"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div key={tab} className="animate-fade-in py-8 text-sm leading-relaxed text-navy/70 sm:text-base">
          {tab === "description" && (
            <p className="max-w-3xl">{product.description || "Описание скоро появится."}</p>
          )}
          {tab === "specs" &&
            (product.attributes.length > 0 ? (
              <dl className="grid max-w-3xl gap-3 sm:grid-cols-2">
                {product.attributes.map((attr) => (
                  <div key={attr.key} className="rounded-2xl bg-cream-light px-4 py-3">
                    <dt className="text-xs text-navy/50">{attr.key}</dt>
                    <dd className="mt-0.5 text-sm font-semibold text-navy">{attr.value}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p>Характеристики уточнит менеджер.</p>
            ))}
          {tab === "delivery" &&
            (deliveryBlocks.length > 0 ? (
              <div className="max-w-3xl">
                <PageBlocks blocks={deliveryBlocks} />
              </div>
            ) : (
              <p>
                Сроки доставки и условия оплаты уточняются менеджером после
                подтверждения заказа.
              </p>
            ))}
        </div>
      </div>

      {/* Related products */}
      {related.length > 0 && (
        <div className="mt-10 border-t border-navy/10 pt-14">
          <span className="eyebrow">Ещё из раздела</span>
          <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-navy">
            Похожие модели
          </h2>
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
