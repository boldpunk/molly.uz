import { ProductForm } from "@/components/admin/product-form";
import { createProduct } from "@/lib/admin-actions";
import { getCategories } from "@/lib/data";

export default async function NewProductPage() {
  const categories = await getCategories();

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-navy">
        Новый товар
      </h1>
      <div className="mt-6">
        <ProductForm action={createProduct} categories={categories} />
      </div>
    </div>
  );
}
