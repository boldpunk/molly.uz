import { eq, asc } from "drizzle-orm";
import { db } from "@/db";
import { products as productsTable, categories as categoriesTable } from "@/db/schema";
import { formatSum } from "@/lib/format";
import { applyDiscount } from "@/lib/pricing";
import { PageHeader } from "@/components/admin/page-header";
import { ProductsIcon } from "@/components/admin/icons";
import { ProductsTable, type ProductGroup } from "@/components/admin/products-table";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const [rows, categories] = await Promise.all([
    db
      .select({ product: productsTable, category: categoriesTable })
      .from(productsTable)
      .innerJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
      .orderBy(asc(categoriesTable.sortOrder), asc(productsTable.name)),
    db.select({ id: categoriesTable.id, name: categoriesTable.name }).from(categoriesTable).orderBy(asc(categoriesTable.sortOrder)),
  ]);

  const groups: ProductGroup[] = [];
  for (const { product: p, category } of rows) {
    let group = groups.find((g) => g.category.id === category.id);
    if (!group) {
      group = { category: { id: category.id, name: category.name }, items: [] };
      groups.push(group);
    }
    group.items.push({
      id: p.id,
      name: p.name,
      imageUrl: p.imageUrl,
      priceLabel:
        p.pricingMode === "per_metre" && p.hardwareOptions?.length
          ? `от ${formatSum(
              applyDiscount(Math.min(...p.hardwareOptions.map((h) => h.pricePerMetre)), p.discountPercent)
            )} / пог.м`
          : p.pricingMode === "fixed" && p.basePrice
            ? formatSum(applyDiscount(p.basePrice, p.discountPercent))
            : "по запросу",
      discountPercent: p.discountPercent,
      isFeatured: p.isFeatured,
      isPublished: p.isPublished,
    });
  }
  const hidden = rows.filter((r) => !r.product.isPublished).length;

  return (
    <div>
      <PageHeader
        title="Товары"
        description={`${rows.length} в каталоге${hidden ? ` · ${hidden} скрыто с сайта` : ""}. Отметьте несколько, чтобы изменить их разом.`}
        action={{ href: "/admin/products/new", label: "Добавить товар" }}
      />
      {rows.length === 0 ? (
        <div className="mt-6 flex flex-col items-center gap-2 rounded-[1.5rem] border border-navy/[0.07] bg-white py-16 text-center">
          <ProductsIcon className="h-8 w-8 text-navy/20" />
          <p className="text-sm text-navy/45">Товаров пока нет.</p>
        </div>
      ) : (
        <ProductsTable groups={groups} categories={categories} />
      )}
    </div>
  );
}
