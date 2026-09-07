import Link from "next/link";
import { Product } from "@/lib/types";
import { categories, formatSum } from "@/lib/data";
import { PlaceholderImage } from "./placeholder-image";

export function ProductCard({ product }: { product: Product }) {
  const category = categories.find((c) => c.id === product.categoryId);
  const href = `/catalog/${category?.slug}/${product.slug}`;

  return (
    <Link
      href={href}
      className="group flex flex-col gap-3 rounded-xl border border-navy/10 bg-white/40 p-3 transition hover:border-sage-dark/40 hover:shadow-md"
    >
      <PlaceholderImage
        label={product.name}
        className="w-full transition group-hover:scale-[1.01]"
      />
      <div>
        <h3 className="font-heading text-base font-semibold text-navy">
          {product.name}
        </h3>
        <p className="mt-0.5 text-xs text-navy/60">{product.specLine}</p>
        <p className="mt-2 text-sm font-medium text-sage-dark">
          {product.pricingMode === "per_metre" && product.hardwareOptions
            ? `от ${formatSum(
                Math.min(...product.hardwareOptions.map((h) => h.pricePerMetre))
              )} / пог.м`
            : "Цена по запросу"}
        </p>
      </div>
    </Link>
  );
}
