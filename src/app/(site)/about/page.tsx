import { getPageBySlug } from "@/lib/data";
import { PageBlocks } from "@/components/page-blocks";

export const metadata = { title: "О бренде — Molly Home" };
export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const page = await getPageBySlug("about");

  return (
    <div className="mx-auto max-w-3xl px-6 py-14">
      <h1 className="font-heading text-3xl font-bold text-navy">
        {page?.title ?? "О бренде"}
      </h1>
      {page && <PageBlocks blocks={page.blocks} />}
    </div>
  );
}
