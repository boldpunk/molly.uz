import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getCategoryBySlug,
  getProduct,
  getRelatedProducts,
  isFavourite,
  getPageBySlug,
} from "@/lib/data";
import { getCurrentCustomer } from "@/lib/customers";
import { ProductDetail } from "@/components/product-detail";
import { productMetadata } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; product: string }>;
}): Promise<Metadata> {
  const { category: categorySlug, product: productSlug } = await params;
  const product = await getProduct(categorySlug, productSlug);
  if (!product) return {};

  return productMetadata({
    title: product.metaTitle || `${product.name} — Molly Home`,
    description:
      product.metaDescription || product.specLine || product.description,
    image: product.imageUrl || undefined,
    url: `${SITE_URL}/catalog/${categorySlug}/${productSlug}`,
  });
}

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
  const customer = await getCurrentCustomer();
  const initialIsFavourite = customer
    ? await isFavourite(customer.id, product.id)
    : false;
  const deliveryPage = await getPageBySlug("delivery");

  return (
    <ProductDetail
      category={category}
      product={product}
      related={related}
      initialIsFavourite={initialIsFavourite}
      deliveryBlocks={deliveryPage?.blocks ?? []}
    />
  );
}
