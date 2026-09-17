import Image from "next/image";
import Link from "next/link";
import { eq, asc } from "drizzle-orm";
import { db } from "@/db";
import { products as productsTable, categories as categoriesTable } from "@/db/schema";
import { formatSum } from "@/lib/format";
import { applyDiscount } from "@/lib/pricing";
import { duplicateProduct } from "@/lib/admin-actions";
import { PageHeader } from "@/components/admin/page-header";
import { ArrowRightIcon, CopyIcon, ProductsIcon } from "@/components/admin/icons";
import { getCategoryIcon } from "@/components/icons/categories";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const rows = await db
    .select({ product: productsTable, category: categoriesTable })
    .from(productsTable)
    .innerJoin(
      categoriesTable,
      eq(productsTable.categoryId, categoriesTable.id)
    )
    .orderBy(asc(categoriesTable.sortOrder), asc(productsTable.name));

  const groups: { category: typeof categoriesTable.$inferSelect; items: typeof rows }[] = [];
  for (const row of rows) {
    let group = groups.find((g) => g.category.id === row.category.id);
    if (!group) {
      group = { category: row.category, items: [] };
      groups.push(group);
    }
    group.items.push(row);
  }

  return (
    <div>
      <PageHeader
        title="Товары"
        description={`${rows.length} ${
          rows.length === 1 ? "товар" : "товаров"
        } в каталоге`}
        action={{ href: "/admin/products/new", label: "Добавить товар" }}
      />

      {rows.length === 0 ? (
        <div className="mt-6 flex flex-col items-center gap-2 rounded-xl border border-navy/10 bg-white py-16 text-center shadow-sm">
          <ProductsIcon className="h-8 w-8 text-navy/20" />
          <p className="text-sm text-navy/40">Товаров пока нет.</p>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-6">
          {groups.map(({ category, items }) => {
            const CategoryIcon = getCategoryIcon(category.slug);
            return (
              <div
                key={category.id}
                className="overflow-hidden rounded-xl border border-navy/10 bg-white shadow-sm"
              >
                <div className="flex items-center gap-2.5 border-b border-navy/10 bg-navy/[0.03] px-5 py-3">
                  <CategoryIcon className="h-5 w-5 text-navy/50" />
                  <h2 className="font-heading text-sm font-semibold text-navy">
                    {category.name}
                  </h2>
                  <span className="text-xs text-navy/40">
                    {items.length}{" "}
                    {items.length === 1 ? "товар" : "товаров"}
                  </span>
                </div>
                <table className="w-full text-sm">
                  <tbody>
                    {items.map(({ product: p }) => (
                      <tr
                        key={p.id}
                        className="group border-b border-navy/5 transition last:border-0 hover:bg-navy/[0.02]"
                      >
                        <td className="w-1/2 px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            {p.imageUrl ? (
                              <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-navy/[0.06]">
                                <Image
                                  src={p.imageUrl}
                                  alt=""
                                  fill
                                  sizes="36px"
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-navy/[0.06] text-xs font-semibold text-navy/60">
                                {p.name.charAt(0).toUpperCase()}
                              </span>
                            )}
                            <div>
                              <span className="font-medium text-navy">{p.name}</span>
                              {p.isFeatured && (
                                <span className="ml-2 rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-medium text-accent-dark">
                                  популярное
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-navy/60">
                          {p.pricingMode === "per_metre" && p.hardwareOptions?.length
                            ? `от ${formatSum(
                                applyDiscount(
                                  Math.min(...p.hardwareOptions.map((h) => h.pricePerMetre)),
                                  p.discountPercent
                                )
                              )} / пог.м`
                            : p.pricingMode === "fixed" && p.basePrice
                              ? formatSum(applyDiscount(p.basePrice, p.discountPercent))
                              : "по запросу"}
                          {p.discountPercent ? (
                            <span className="ml-1.5 rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-600">
                              -{p.discountPercent}%
                            </span>
                          ) : null}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-4">
                            <form action={duplicateProduct.bind(null, p.id)}>
                              <button
                                type="submit"
                                className="inline-flex items-center gap-1 text-xs font-medium text-navy/50 transition hover:text-navy"
                              >
                                <CopyIcon className="h-3.5 w-3.5" />
                                Дублировать
                              </button>
                            </form>
                            <Link
                              href={`/admin/products/${p.id}`}
                              className="inline-flex items-center gap-1 text-xs font-medium text-navy/50 transition hover:text-navy"
                            >
                              Редактировать
                              <ArrowRightIcon className="h-3 w-3" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
