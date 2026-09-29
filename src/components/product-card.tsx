import Image from "next/image";
import Link from "next/link";
import { Product } from "@/lib/types";
import { formatSum } from "@/lib/format";
import { getDisplayPrice } from "@/lib/pricing";
import { PlaceholderImage } from "./placeholder-image";

const MAX_SWATCHES = 4;

export function ProductCard({
  product,
  hideFeaturedBadge = false,
}: {
  product: Product;
  /** In a list of popular models every card is a hit, so the badge is noise. */
  hideFeaturedBadge?: boolean;
}) {
  const href = `/catalog/${product.categorySlug}/${product.slug}`;
  const price = getDisplayPrice(product);
  // A second photo, when there is one, is shown on hover — the quickest way
  // to see a piece from another angle without opening it.
  const altImage = product.galleryUrls.find((url) => url && url !== product.imageUrl);
  const swatches = (product.colourOptions ?? []).filter((c) => c.swatch);

  return (
    <Link
      href={href}
      className="group relative flex flex-col rounded-2xl bg-white transition duration-500 hover:-translate-y-1"
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-cream-light ring-1 ring-navy/5 transition duration-500 group-hover:shadow-2xl group-hover:shadow-navy/15">
        {product.imageUrl ? (
          <>
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
              className={`object-cover transition duration-700 ease-out group-hover:scale-[1.06] ${
                altImage ? "group-hover:opacity-0" : ""
              }`}
            />
            {altImage && (
              <Image
                src={altImage}
                alt=""
                aria-hidden
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                className="scale-[1.06] object-cover opacity-0 transition duration-700 ease-out group-hover:scale-100 group-hover:opacity-100"
              />
            )}
          </>
        ) : (
          <PlaceholderImage label={product.name} aspect="aspect-square" className="h-full w-full" />
        )}

        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {price?.discountPercent ? (
            <span className="rounded-full bg-clay px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
              −{price.discountPercent}%
            </span>
          ) : null}
          {product.isFeatured && !hideFeaturedBadge && (
            <span className="rounded-full bg-navy px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-cream shadow-sm">
              Хит
            </span>
          )}
        </div>

        <span
          aria-hidden
          className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-navy shadow-sm backdrop-blur transition duration-500 group-hover:rotate-[-45deg] group-hover:bg-navy group-hover:text-white"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>

        <div className="absolute inset-x-3 bottom-3 translate-y-3 opacity-0 transition duration-500 group-hover:translate-y-0 group-hover:opacity-100 max-md:hidden">
          <span className="flex items-center justify-center rounded-full bg-navy/90 py-2.5 text-xs font-semibold text-white backdrop-blur">
            Смотреть модель
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-1 pb-1 pt-4">
        {product.collection && (
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-clay">
            {product.collection}
          </span>
        )}
        <h3 className="mt-1 font-heading text-base font-semibold text-navy transition group-hover:text-clay sm:text-lg">
          {product.name}
        </h3>
        {product.specLine && (
          <p className="mt-1 line-clamp-2 text-xs text-navy/55">{product.specLine}</p>
        )}

        <div className="mt-auto flex flex-wrap items-end justify-between gap-2 pt-3">
          {price ? (
            <div className="flex flex-col">
              {price.originalAmount && (
                <span className="text-xs text-navy/40 line-through">
                  {formatSum(price.originalAmount)}
                </span>
              )}
              <span className="text-sm font-bold text-navy sm:text-base">
                {product.pricingMode === "per_metre" ? "от " : ""}
                {formatSum(price.amount)}
                {product.pricingMode === "per_metre" && (
                  <span className="text-xs font-medium text-navy/50"> / пог.м</span>
                )}
              </span>
            </div>
          ) : (
            <span className="rounded-full bg-sage-light px-3 py-1 text-xs font-semibold text-sage">
              Цена по запросу
            </span>
          )}

          {swatches.length > 0 && (
            <div className="flex items-center -space-x-1.5" aria-label={`${swatches.length} цвет.`}>
              {swatches.slice(0, MAX_SWATCHES).map((c) => (
                <span
                  key={c.id}
                  title={c.label}
                  className="h-5 w-5 rounded-full border-2 border-white shadow-sm ring-1 ring-navy/10 transition group-hover:translate-x-0.5"
                  style={{ backgroundColor: c.swatch }}
                />
              ))}
              {swatches.length > MAX_SWATCHES && (
                <span className="pl-2.5 text-[11px] font-medium text-navy/50">
                  +{swatches.length - MAX_SWATCHES}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
