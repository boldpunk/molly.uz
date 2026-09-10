import { CategoryForm } from "@/components/admin/category-form";
import { createCategory } from "@/lib/admin-actions";
import { PageHeader } from "@/components/admin/page-header";

export default function NewCategoryPage() {
  return (
    <div>
      <PageHeader
        title="Новая категория"
        back={{ href: "/admin/categories", label: "Категории" }}
      />
      <div className="mt-6">
        <CategoryForm action={createCategory} />
      </div>
    </div>
  );
}
