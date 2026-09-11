import Image from "next/image";
import Link from "next/link";
import type { PageBlock } from "@/db/schema";
import { PlaceholderImage } from "@/components/placeholder-image";
import { BrandSlider } from "@/components/brand-slider";
import { UspIcon, isBrandLogoIcon } from "@/components/usp-icons";
import { ReviewsGrid } from "@/components/reviews-grid";

export function PageBlocks({ blocks }: { blocks: PageBlock[] }) {
  return (
    <>
      {blocks.map((block, i) => (
        <PageBlockView key={i} block={block} />
      ))}
    </>
  );
}

function PageBlockView({ block }: { block: PageBlock }) {
  switch (block.type) {
    case "heading":
      return (
        <h2 className="font-heading mt-8 text-xl font-bold text-navy first:mt-0">
          {block.text}
        </h2>
      );
    case "paragraph":
      return (
        <p className="mt-4 text-sm leading-relaxed text-navy/70 first:mt-0">
          {block.text}
        </p>
      );
    case "image":
      if (!block.url) {
        return (
          <PlaceholderImage
            label={block.alt || "Изображение"}
            aspect="aspect-[16/9]"
            className="mt-6 first:mt-0"
          />
        );
      }
      return (
        <div className="relative mt-6 aspect-[16/9] w-full overflow-hidden rounded-lg first:mt-0">
          <Image
            src={block.url}
            alt={block.alt}
            fill
            sizes="100vw"
            className="object-cover"
          />
        </div>
      );
    case "stat_list": {
      const colsClass =
        block.items.length >= 5 ? "grid-cols-3 sm:grid-cols-5" : "grid-cols-2 sm:grid-cols-4";
      return (
        <div className={`mt-6 grid ${colsClass} gap-6 border-y border-navy/10 py-6 first:mt-0`}>
          {block.items.map((item, i) =>
            isBrandLogoIcon(item.icon) ? (
              <div key={i} className="flex flex-col gap-2">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-navy/10 bg-white">
                  <UspIcon icon={item.icon} className="h-9 w-9" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-navy">{item.value}</p>
                  <p className="mt-1 text-xs text-navy/60">{item.label}</p>
                </div>
              </div>
            ) : (
              <div key={i} className="flex flex-col gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-navy/5 text-navy">
                  <UspIcon icon={item.icon} className="h-4.5 w-4.5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-navy">{item.value}</p>
                  <p className="mt-1 text-xs text-navy/60">{item.label}</p>
                </div>
              </div>
            )
          )}
        </div>
      );
    }
    case "cta":
      return (
        <Link
          href={block.href}
          className="mt-6 inline-block rounded-full bg-navy px-6 py-3 text-sm font-semibold text-white transition hover:bg-navy/90 first:mt-0"
        >
          {block.label}
        </Link>
      );
    case "brand_list":
      return (
        <div className="mt-6 first:mt-0">
          <BrandSlider items={block.items} />
        </div>
      );
    case "reviews":
      return (
        <div className="mt-6 first:mt-0">
          <ReviewsGrid items={block.items} />
        </div>
      );
  }
}
