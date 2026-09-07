import { notFound } from "next/navigation";
import { getCategoryBySlug, getProduct, getRelatedProducts } from "@/lib/data";
import { ProductDetail } from "@/components/product-detail";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ category: string; product: string }>;
}) {
  const { category: categorySlug, product: productSlug } = await params;
  const category = await getCategoryBySlug(categorySlug);
  if (!category) notFound();

  const product = await getProduct(categorySlug, productSlug);
  if (!product) notFound();

  const related = await getRelatedProducts(product);

  return (
    <ProductDetail category={category} product={product} related={related} />
  );
}
