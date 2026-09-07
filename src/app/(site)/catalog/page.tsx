import { getAllProducts, getCategories } from "@/lib/data";
import { CatalogView } from "@/components/catalog-view";

export default async function AllProductsPage() {
  const [categories, products] = await Promise.all([
    getCategories(),
    getAllProducts(),
  ]);

  return (
    <CatalogView category={null} categories={categories} products={products} />
  );
}
