import { ProductForm } from "@/components/admin/product-form";
import { createProduct } from "@/lib/admin-actions";
import { getCategories } from "@/lib/data";
import { PageHeader } from "@/components/admin/page-header";

export default async function NewProductPage() {
  const categories = await getCategories();

  return (
    <div>
      <PageHeader
        title="Новый товар"
        back={{ href: "/admin/products", label: "Товары" }}
      />
      <div className="mt-6">
        <ProductForm action={createProduct} categories={categories} />
      </div>
    </div>
  );
}
