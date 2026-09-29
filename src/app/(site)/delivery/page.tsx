import { getPageBySlug } from "@/lib/data";
import { PageBlocks } from "@/components/page-blocks";
import { PageHero } from "@/components/page-hero";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const page = await getPageBySlug("delivery");
  return pageMetadata(
    page,
    "Доставка и оплата — Molly Home",
    "Условия доставки и оплаты мебели Molly Home.",
    "/images/hero.jpg",
    "/delivery"
  );
}

export default async function DeliveryPage() {
  const page = await getPageBySlug("delivery");
  const blocks = page?.blocks ?? [];
  const intro = blocks[0]?.type === "paragraph" ? blocks[0] : undefined;
  const rest = intro ? blocks.slice(1) : blocks;

  return (
    <>
      <PageHero
        eyebrow="Покупателям"
        title={page?.title ?? "Доставка и оплата"}
        text={intro?.text}
      />
      <article className="mx-auto max-w-4xl px-6 py-16">
        <PageBlocks blocks={rest} />
      </article>
    </>
  );
}
