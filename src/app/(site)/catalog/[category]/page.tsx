import { notFound } from "next/navigation";
import { getCategories, getCategoryBySlug, getProductsByCategory } from "@/lib/data";
import { CatalogView } from "@/components/catalog-view";

export default async function CatalogPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: slug } = await params;
  const [category, categories] = await Promise.all([
    getCategoryBySlug(slug),
    getCategories(),
  ]);
  if (!category) notFound();

  const products = await getProductsByCategory(category.id, category.slug);

  return (
    <CatalogView category={category} categories={categories} products={products} />
  );
}
