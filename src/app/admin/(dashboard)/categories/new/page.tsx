import { CategoryForm } from "@/components/admin/category-form";
import { createCategory } from "@/lib/admin-actions";

export default function NewCategoryPage() {
  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-navy">
        Новая категория
      </h1>
      <div className="mt-6">
        <CategoryForm action={createCategory} />
      </div>
    </div>
  );
}
