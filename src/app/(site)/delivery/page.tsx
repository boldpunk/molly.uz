import { getPageBySlug } from "@/lib/data";
import { PageBlocks } from "@/components/page-blocks";

export const metadata = { title: "Доставка и оплата — Molly Home" };
export const dynamic = "force-dynamic";

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
