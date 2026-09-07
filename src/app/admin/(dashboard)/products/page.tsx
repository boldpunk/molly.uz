import Link from "next/link";
import { eq, asc } from "drizzle-orm";
import { db } from "@/db";
import { products as productsTable, categories as categoriesTable } from "@/db/schema";
import { formatSum } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const rows = await db
    .select({ product: productsTable, categoryName: categoriesTable.name })
    .from(productsTable)
    .innerJoin(
      categoriesTable,
      eq(productsTable.categoryId, categoriesTable.id)
    )
    .orderBy(asc(categoriesTable.sortOrder), asc(productsTable.name));

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-navy">Товары</h1>
        <Link
          href="/admin/products/new"
          className="rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy/90"
        >
          + Добавить товар
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-navy/10 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-navy/10 bg-navy/[0.02] text-left text-xs uppercase tracking-wide text-navy/50">
            <tr>
              <th className="px-4 py-3">Название</th>
              <th className="px-4 py-3">Категория</th>
              <th className="px-4 py-3">Цена</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map(({ product: p, categoryName }) => (
              <tr key={p.id} className="border-b border-navy/5 last:border-0">
                <td className="px-4 py-3 font-medium text-navy">
                  {p.name}
                  {p.isFeatured && (
                    <span className="ml-2 rounded-full bg-sage/15 px-2 py-0.5 text-[11px] font-medium text-sage-dark">
                      популярное
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-navy/60">{categoryName}</td>
                <td className="px-4 py-3 text-navy/60">
                  {p.pricingMode === "per_metre" && p.hardwareOptions?.length
                    ? `от ${formatSum(
                        Math.min(...p.hardwareOptions.map((h) => h.pricePerMetre))
                      )} / пог.м`
                    : "по запросу"}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/products/${p.id}`}
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
