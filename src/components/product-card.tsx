import Link from "next/link";
import { Product } from "@/lib/types";
import { formatSum } from "@/lib/format";
import { PlaceholderImage } from "./placeholder-image";

export function ProductCard({ product }: { product: Product }) {
  const href = `/catalog/${product.categorySlug}/${product.slug}`;

  return (
    <Link
      href={href}
      className="group flex flex-col gap-3 rounded-xl border border-navy/10 bg-white p-3 transition hover:border-navy/30 hover:shadow-md"
    >
      {product.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={product.imageUrl}
          alt={product.name}
          className="aspect-[4/3] w-full rounded-lg object-cover transition group-hover:scale-[1.01]"
        />
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
        {product.pricingMode === "per_metre" && product.hardwareOptions ? (
          <p className="mt-2 text-sm font-semibold text-navy">
            от{" "}
            {formatSum(
              Math.min(...product.hardwareOptions.map((h) => h.pricePerMetre))
            )}{" "}
            / пог.м
          </p>
        ) : (
          <span className="mt-2 inline-block rounded-full bg-sage/15 px-2.5 py-1 text-xs font-semibold text-sage-dark">
            Цена по запросу
          </span>
        )}
      </div>
    </Link>
  );
}
