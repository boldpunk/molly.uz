import { notFound } from "next/navigation";
import { categories, getCategoryBySlug, getProductsByCategory } from "@/lib/data";
import { CatalogView } from "@/components/catalog-view";

export function generateStaticParams() {
  return categories.map((c) => ({ category: c.slug }));
}

export default async function CatalogPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) notFound();

  const products = getProductsByCategory(category.id);

  return <CatalogView category={category} products={products} />;
}
