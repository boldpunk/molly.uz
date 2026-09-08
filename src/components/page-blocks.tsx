import Link from "next/link";
import type { PageBlock } from "@/db/schema";
import { PlaceholderImage } from "@/components/placeholder-image";
import { BrandSlider } from "@/components/brand-slider";
import { UspIcon } from "@/components/usp-icons";

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
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={block.url}
          alt={block.alt}
          className="mt-6 aspect-[16/9] w-full rounded-lg object-cover first:mt-0"
        />
      );
    case "stat_list":
      return (
        <div className="mt-6 grid grid-cols-2 gap-6 border-y border-navy/10 py-6 first:mt-0 sm:grid-cols-4">
          {block.items.map((item, i) => (
            <div key={i} className="flex flex-col gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-navy/5 text-navy">
                <UspIcon icon={item.icon} className="h-4.5 w-4.5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-navy">{item.value}</p>
                <p className="mt-1 text-xs text-navy/60">{item.label}</p>
              </div>
            </div>
          ))}
        </div>
      );
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
  }
}
