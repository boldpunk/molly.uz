import Link from "next/link";
import { getCategories } from "@/lib/data";
import { PageHeader } from "@/components/admin/page-header";
import { ArrowRightIcon, CategoriesIcon } from "@/components/admin/icons";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await getCategories();

  return (
    <div>
      <PageHeader
        title="Категории"
        description={`${categories.length} ${
          categories.length === 1 ? "категория" : "категорий"
        } в каталоге`}
        action={{ href: "/admin/categories/new", label: "Добавить категорию" }}
      />

      <div className="mt-6 overflow-hidden rounded-xl border border-navy/10 bg-white shadow-sm">
        {categories.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <CategoriesIcon className="h-8 w-8 text-navy/20" />
            <p className="text-sm text-navy/40">Категорий пока нет.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-navy/10 bg-navy/[0.02] text-left text-xs uppercase tracking-wide text-navy/50">
              <tr>
                <th className="px-5 py-3 font-medium">Название</th>
                <th className="px-5 py-3 font-medium">Slug</th>
                <th className="px-5 py-3 font-medium">Порядок</th>
                <th className="px-5 py-3 font-medium">Статус</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr
                  key={c.id}
                  className="group border-b border-navy/5 transition last:border-0 hover:bg-navy/[0.02]"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-navy/[0.06] text-xs font-semibold text-navy/60">
                        {c.name.charAt(0).toUpperCase()}
                      </span>
                      <span className="font-medium text-navy">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs text-navy/50">
                    {c.slug}
                  </td>
                  <td className="px-5 py-3.5 text-navy/60">{c.sortOrder}</td>
                  <td className="px-5 py-3.5">
                    {c.isPlaceholder ? (
                      <span className="rounded-full bg-sage/15 px-2.5 py-1 text-xs font-medium text-sage-dark">
                        наполняется
                      </span>
                    ) : (
                      <span className="rounded-full bg-navy/[0.06] px-2.5 py-1 text-xs font-medium text-navy/50">
                        активна
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link
                      href={`/admin/categories/${c.id}`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-navy/50 transition hover:text-navy"
                    >
                      Редактировать
                      <ArrowRightIcon className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
