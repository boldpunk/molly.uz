import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { products as productsTable } from "@/db/schema";
import { ProductForm } from "@/components/admin/product-form";
import { updateProduct, deleteProduct } from "@/lib/admin-actions";
import { getCategories } from "@/lib/data";
import { PageHeader } from "@/components/admin/page-header";
import { DeleteButton } from "@/components/admin/delete-button";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [row] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, id))
    .limit(1);
  if (!row) notFound();

  const categories = await getCategories();
  const category = categories.find((c) => c.id === row.categoryId);

  const product = {
    id: row.id,
    categoryId: row.categoryId,
    categorySlug: category?.slug ?? "",
    slug: row.slug,
    name: row.name,
    specLine: row.specLine,
    description: row.description,
    pricingMode: row.pricingMode,
    pricePerMetre: row.pricePerMetre ?? undefined,
    hardwareOptions: row.hardwareOptions ?? undefined,
    colourOptions: row.colourOptions ?? undefined,
    collection: row.collection ?? undefined,
    attributes: row.attributes,
    isSample: row.isSample,
    isFeatured: row.isFeatured,
    imageUrl: row.imageUrl ?? undefined,
    galleryUrls: row.galleryUrls,
  };

  const updateWithId = updateProduct.bind(null, id);
  const deleteWithId = deleteProduct.bind(null, id);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          title={product.name}
          back={{ href: "/admin/products", label: "Товары" }}
        />
        <DeleteButton action={deleteWithId} label="Удалить товар" />
      </div>
      <div className="mt-6">
        <ProductForm
          action={updateWithId}
          categories={categories}
          product={product}
        />
      </div>
    </div>
  );
}
