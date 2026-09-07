import { notFound } from "next/navigation";
import {
  categories,
  getCategoryBySlug,
  getProduct,
  getProductsByCategory,
  getRelatedProducts,
} from "@/lib/data";
import { ProductDetail } from "@/components/product-detail";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ category: string; product: string }>;
}) {
  const { category: categorySlug, product: productSlug } = await params;
  const category = getCategoryBySlug(categorySlug);
  if (!category) notFound();

  const product = getProduct(categorySlug, productSlug);
  if (!product) notFound();

  const related = getRelatedProducts(product);

  return (
    <ProductDetail category={category} product={product} related={related} />
  );
}

export function generateStaticParams() {
  return categories.flatMap((c) =>
    getProductsByCategory(c.id).map((p) => ({
      category: c.slug,
      product: p.slug,
    }))
  );
}
