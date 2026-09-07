import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { categories as categoriesTable } from "@/db/schema";
import { CategoryForm } from "@/components/admin/category-form";
import { updateCategory, deleteCategory } from "@/lib/admin-actions";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [row] = await db
    .select()
    .from(categoriesTable)
    .where(eq(categoriesTable.id, id))
    .limit(1);
  if (!row) notFound();

  const category = {
    id: row.id,
    name: row.name,
    slug: row.slug,
    isPlaceholder: row.isPlaceholder,
    sortOrder: row.sortOrder,
    filterKind: row.filterKind as "kitchen" | "collection" | "none",
  };

  const updateWithId = updateCategory.bind(null, id);
  const deleteWithId = deleteCategory.bind(null, id);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-navy">
          {category.name}
        </h1>
        <form action={deleteWithId}>
          <button
            type="submit"
            className="text-sm font-medium text-red-600 hover:underline"
          >
            Удалить категорию
          </button>
        </form>
      </div>
      <div className="mt-6">
        <CategoryForm action={updateWithId} category={category} />
      </div>
    </div>
  );
}
