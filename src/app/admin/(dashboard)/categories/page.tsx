import Link from "next/link";
import { getCategories } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await getCategories();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-navy">
          Категории
        </h1>
        <Link
          href="/admin/categories/new"
          className="rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy/90"
        >
          + Добавить категорию
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-navy/10 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-navy/10 bg-navy/[0.02] text-left text-xs uppercase tracking-wide text-navy/50">
            <tr>
              <th className="px-4 py-3">Название</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Порядок</th>
              <th className="px-4 py-3">Статус</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id} className="border-b border-navy/5 last:border-0">
                <td className="px-4 py-3 font-medium text-navy">{c.name}</td>
                <td className="px-4 py-3 text-navy/60">{c.slug}</td>
                <td className="px-4 py-3 text-navy/60">{c.sortOrder}</td>
                <td className="px-4 py-3">
                  {c.isPlaceholder ? (
                    <span className="rounded-full bg-sage/15 px-2 py-0.5 text-xs font-medium text-sage-dark">
                      наполняется
                    </span>
                  ) : (
                    <span className="text-xs text-navy/40">активна</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/categories/${c.id}`}
                    className="text-xs font-medium text-navy/60 hover:text-navy hover:underline"
                  >
                    Редактировать
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
