import Link from "next/link";
import { eq, asc } from "drizzle-orm";
import { db } from "@/db";
import { products as productsTable, categories as categoriesTable } from "@/db/schema";
import { formatSum } from "@/lib/format";
import { PageHeader } from "@/components/admin/page-header";
import { ArrowRightIcon, ProductsIcon } from "@/components/admin/icons";

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
      <PageHeader
        title="Товары"
        description={`${rows.length} ${
          rows.length === 1 ? "товар" : "товаров"
        } в каталоге`}
        action={{ href: "/admin/products/new", label: "Добавить товар" }}
      />

      <div className="mt-6 overflow-hidden rounded-xl border border-navy/10 bg-white shadow-sm">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <ProductsIcon className="h-8 w-8 text-navy/20" />
            <p className="text-sm text-navy/40">Товаров пока нет.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-navy/10 bg-navy/[0.02] text-left text-xs uppercase tracking-wide text-navy/50">
              <tr>
                <th className="px-5 py-3 font-medium">Название</th>
                <th className="px-5 py-3 font-medium">Категория</th>
                <th className="px-5 py-3 font-medium">Цена</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map(({ product: p, categoryName }) => (
                <tr
                  key={p.id}
                  className="group border-b border-navy/5 transition last:border-0 hover:bg-navy/[0.02]"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-navy/[0.06] text-xs font-semibold text-navy/60">
                        {p.name.charAt(0).toUpperCase()}
                      </span>
                      <div>
                        <span className="font-medium text-navy">{p.name}</span>
                        {p.isFeatured && (
                          <span className="ml-2 rounded-full bg-sage/15 px-2 py-0.5 text-[11px] font-medium text-sage-dark">
                            популярное
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-navy/60">{categoryName}</td>
                  <td className="px-5 py-3.5 text-navy/60">
                    {p.pricingMode === "per_metre" && p.hardwareOptions?.length
                      ? `от ${formatSum(
                          Math.min(...p.hardwareOptions.map((h) => h.pricePerMetre))
                        )} / пог.м`
                      : "по запросу"}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link
                      href={`/admin/products/${p.id}`}
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
