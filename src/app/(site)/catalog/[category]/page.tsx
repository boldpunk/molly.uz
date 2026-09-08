import { notFound } from "next/navigation";
import { getCategories, getCategoryBySlug, getProductsByCategory } from "@/lib/data";
import { CatalogView } from "@/components/catalog-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return {};
  return {
    title: `${category.name} — каталог Molly Home`,
    description: `Каталог «${category.name}» — мебель Molly Home с фильтрами по цвету и фурнитуре.`,
  };
}

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
