import { notFound } from "next/navigation";
import { getCategories, getCategoryBySlug, getProductsByCategory } from "@/lib/data";
import { CatalogView } from "@/components/catalog-view";
import { productMetadata } from "@/lib/seo";
import { CATEGORY_IMAGES } from "@/lib/category-images";
import { SITE_URL } from "@/lib/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return {};
  return productMetadata({
    title: `${category.name} — каталог Molly Home`,
    description: `Каталог «${category.name}» — мебель Molly Home с фильтрами по цвету и фурнитуре.`,
    image: CATEGORY_IMAGES[category.slug],
    url: `${SITE_URL}/catalog/${category.slug}`,
  });
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
