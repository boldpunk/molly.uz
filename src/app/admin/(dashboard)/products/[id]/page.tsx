import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { products as productsTable } from "@/db/schema";
import { ProductForm } from "@/components/admin/product-form";
import { updateProduct, deleteProduct } from "@/lib/admin-actions";
import { getCategories } from "@/lib/data";

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
  };

  const updateWithId = updateProduct.bind(null, id);
  const deleteWithId = deleteProduct.bind(null, id);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-navy">
          {product.name}
        </h1>
        <form action={deleteWithId}>
          <button
            type="submit"
            className="text-sm font-medium text-red-600 hover:underline"
          >
            Удалить товар
          </button>
        </form>
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
