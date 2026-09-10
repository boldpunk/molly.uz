import { getPageBySlug } from "@/lib/data";
import { PageBlocks } from "@/components/page-blocks";
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

  return (
    <div className="mx-auto max-w-3xl px-6 py-14">
      <h1 className="font-heading text-3xl font-bold text-navy">
        {page?.title ?? "Доставка и оплата"}
      </h1>
      {page && <PageBlocks blocks={page.blocks} />}
    </div>
  );
}
