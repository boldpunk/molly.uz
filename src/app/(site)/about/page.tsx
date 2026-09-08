import { getPageBySlug } from "@/lib/data";
import { PageBlocks } from "@/components/page-blocks";
import { BrandSlider } from "@/components/brand-slider";

export const metadata = { title: "О бренде — Molly Home" };
export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const page = await getPageBySlug("about");

  return (
    <div>
      <div className="mx-auto max-w-3xl px-6 py-14">
        <h1 className="font-heading text-3xl font-bold text-navy">
          {page?.title ?? "О бренде"}
        </h1>
        {page && <PageBlocks blocks={page.blocks} />}
      </div>

      <div className="mx-auto max-w-5xl px-6 pb-14">
        <p className="mb-4 text-center text-xs font-semibold uppercase tracking-wide text-navy/40">
          Наши партнёры по фурнитуре
        </p>
        <BrandSlider />
      </div>
    </div>
  );
}
