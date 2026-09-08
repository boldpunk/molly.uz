import { getAllProducts, getCategories } from "@/lib/data";
import { CatalogView } from "@/components/catalog-view";

export const metadata = {
  title: "Каталог — Molly Home",
  description: "Весь каталог мебели Molly Home: кухни, гардеробы, спальни, кровати.",
};

export default async function AllProductsPage() {
  const [categories, products] = await Promise.all([
    getCategories(),
    getAllProducts(),
  ]);

  return (
    <CatalogView category={null} categories={categories} products={products} />
  );
}
