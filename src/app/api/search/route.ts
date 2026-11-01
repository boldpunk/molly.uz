import { NextRequest, NextResponse } from "next/server";
import { getAllProducts, getCategories } from "@/lib/data";
import { getDisplayPrice } from "@/lib/pricing";
import { formatSum } from "@/lib/format";
import { matchesQuery } from "@/lib/search-match";

export const dynamic = "force-dynamic";

// Suggestions for the header search as the visitor types. The catalog is
// small and already cached in memory, so this filters it rather than
// querying the database on every keystroke.
export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 60);
  if (q.length < 2) return NextResponse.json({ products: [], categories: [] });

  const [products, categories] = await Promise.all([getAllProducts(), getCategories()]);
  const categoryName = new Map(categories.map((c) => [c.slug, c.name]));

  const found = products
    .filter((p) =>
      matchesQuery(q, [
        p.name,
        p.specLine,
        p.collection,
        categoryName.get(p.categorySlug),
        ...(p.colourOptions ?? []).map((c) => c.label),
        ...p.attributes.map((a) => a.value),
      ])
    )
    .slice(0, 6)
    .map((p) => {
      const price = getDisplayPrice(p);
      return {
        name: p.name,
        href: `/catalog/${p.categorySlug}/${p.slug}`,
        image: p.imageUrl ?? null,
        category: categoryName.get(p.categorySlug) ?? "",
        price: price
          ? `${p.pricingMode === "per_metre" ? "от " : ""}${formatSum(price.amount)}${p.pricingMode === "per_metre" ? " / пог.м" : ""}`
          : "Цена по запросу",
      };
    });

  const cats = categories
    .filter((c) => !c.isPlaceholder && matchesQuery(q, [c.name]))
    .map((c) => ({ name: c.name, href: `/catalog/${c.slug}` }));

  return NextResponse.json(
    { products: found, categories: cats },
    { headers: { "Cache-Control": "public, max-age=60" } }
  );
}
