import { getPageBySlug } from "@/lib/data";
import { PageBlocks } from "@/components/page-blocks";
import { PageHero } from "@/components/page-hero";
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
  const blocks = page?.blocks ?? [];
  // The page's own photo and opening paragraph lead the hero; the rest of
  // the blocks follow as the article.
  const imageBlock = blocks.find((b) => b.type === "image");
  const intro = blocks.find((b) => b.type === "paragraph");
  const rest = blocks.filter((b) => b !== imageBlock && b !== intro);

  return (
    <>
      <PageHero
        eyebrow="Molly Home"
        title={page?.title ?? "О бренде"}
        text={intro?.type === "paragraph" ? intro.text : undefined}
        image={imageBlock?.type === "image" && imageBlock.url ? imageBlock.url : "/images/about.jpg"}
        imageAlt="Molly Home"
      />
      <article className="mx-auto max-w-4xl px-6 py-16">
        <PageBlocks blocks={rest} />
      </article>
    </>
  );
}
