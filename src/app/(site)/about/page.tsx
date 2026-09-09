import { getPageBySlug } from "@/lib/data";
import { PageBlocks } from "@/components/page-blocks";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const page = await getPageBySlug("about");
  const imageBlock = page?.blocks?.[0];
  const image =
    imageBlock?.type === "image" && imageBlock.url ? imageBlock.url : "/images/about.jpg";
  return pageMetadata(
    page,
    "О бренде — Molly Home",
    "Molly Home — производитель комфортной мебели для дома в Ташкенте.",
    image,
    "/about"
  );
}

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
