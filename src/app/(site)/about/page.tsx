import { getPageBySlug } from "@/lib/data";
import { PageBlocks } from "@/components/page-blocks";
import { PageHero } from "@/components/page-hero";
import { pageMetadata } from "@/lib/seo";
import { FounderSection } from "@/components/founder-section";
import type { PageBlock } from "@/db/schema";

export const dynamic = "force-dynamic";

// Shown until a «Основатель» block is added to the page in the admin, which
// then replaces it (with its own photo and text).
const DEFAULT_FOUNDER: Extract<PageBlock, { type: "founder" }> = {
  type: "founder",
  name: "Саидазим Тойчибаев",
  role: "Основатель Molly Home",
  photoUrl: "",
  text:
    "Саидазим основал Molly Home как мебельную фабрику полного цикла: собственное производство в Ташкенте и одна команда от первого замера до сборки у вас дома.\n\nПоэтому мебель здесь делают под конкретную квартиру — по размерам, которые снял замерщик, а не по стандартной сетке. И за сроки, материалы и результат отвечает тот, кто её сделал.",
};

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
  const founderBlock = blocks.find((b) => b.type === "founder");
  const founder = founderBlock?.type === "founder" ? founderBlock : DEFAULT_FOUNDER;
  const rest = blocks.filter((b) => b !== imageBlock && b !== intro && b !== founderBlock);

  return (
    <>
      <PageHero
        eyebrow="Molly Home"
        title={page?.title ?? "О бренде"}
        text={intro?.type === "paragraph" ? intro.text : undefined}
        image={imageBlock?.type === "image" && imageBlock.url ? imageBlock.url : "/images/about.jpg"}
        imageAlt="Molly Home"
      />
      <div className="mt-10">
        <FounderSection founder={founder} />
      </div>
      <article className="mx-auto max-w-4xl px-6 py-16">
        <PageBlocks blocks={rest} />
      </article>
    </>
  );
}
