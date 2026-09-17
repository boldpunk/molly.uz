import Image from "next/image";
import Link from "next/link";
import { Product } from "@/lib/types";
import { formatSum } from "@/lib/format";
import { getDisplayPrice } from "@/lib/pricing";
import { PlaceholderImage } from "./placeholder-image";

export function ProductCard({ product }: { product: Product }) {
  const href = `/catalog/${product.categorySlug}/${product.slug}`;
  const price = getDisplayPrice(product);

  return (
    <Link
      href={href}
      className="group flex flex-col gap-3 rounded-xl border border-navy/10 bg-white p-3 transition hover:border-navy/30 hover:shadow-md"
    >
      {product.imageUrl ? (
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(min-width: 768px) 25vw, 50vw"
            className="object-cover transition group-hover:scale-[1.01]"
          />
          {price?.discountPercent && (
            <span className="absolute left-2 top-2 rounded-full bg-red-600 px-2 py-1 text-xs font-bold text-white">
              -{price.discountPercent}%
            </span>
          )}
        </div>
      ) : (
        <PlaceholderImage
          label={product.name}
          className="w-full transition group-hover:scale-[1.01]"
        />
      )}
      <div>
        <h3 className="font-heading text-base font-semibold text-navy">
          {product.name}
        </h3>
        <p className="mt-0.5 text-xs text-navy/60">{product.specLine}</p>
        {price ? (
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-sm font-semibold text-navy">
              {product.pricingMode === "per_metre" ? "от " : ""}
              {formatSum(price.amount)}
              {product.pricingMode === "per_metre" ? " / пог.м" : ""}
            </p>
            {price.originalAmount && (
              <p className="text-xs text-navy/40 line-through">
                {formatSum(price.originalAmount)}
              </p>
            )}
          </div>
        ) : (
          <span className="mt-2 inline-block rounded-full bg-accent/15 px-2.5 py-1 text-xs font-semibold text-accent-dark">
            Цена по запросу
          </span>
        )}
      </div>
    </Link>
  );
}
