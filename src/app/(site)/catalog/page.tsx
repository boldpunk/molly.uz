import { getAllProducts, getCategories } from "@/lib/data";
import { CatalogView } from "@/components/catalog-view";
import { productMetadata } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

export const metadata = productMetadata({
  title: "Каталог — Molly Home",
  description: "Весь каталог мебели Molly Home: кухни, гардеробы, спальни, кровати.",
  image: "/images/hero.jpg",
  url: `${SITE_URL}/catalog`,
});

export default async function AllProductsPage() {
  const [categories, products] = await Promise.all([
    getCategories(),
    getAllProducts(),
  ]);

  return (
    <CatalogView category={null} categories={categories} products={products} />
  );
}
