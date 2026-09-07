import Link from "next/link";
import { count, sql, desc } from "drizzle-orm";
import { db } from "@/db";
import { requests, requestItems, products, categories } from "@/db/schema";
import { formatSum } from "@/lib/format";
import { REQUEST_STATUSES } from "@/lib/types";
import { StatusBadge } from "@/components/admin/status-badge";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [
    statusCounts,
    categoryCounts,
    topProducts,
    totals,
    recentRequests,
  ] = await Promise.all([
    db
      .select({ status: requests.status, total: count() })
      .from(requests)
      .groupBy(requests.status),
    db
      .select({ categoryName: categories.name, total: count() })
      .from(products)
      .innerJoin(categories, sql`${products.categoryId} = ${categories.id}`)
      .groupBy(categories.name, categories.sortOrder)
      .orderBy(categories.sortOrder),
    db
      .select({ productName: requestItems.productName, total: count() })
      .from(requestItems)
      .groupBy(requestItems.productName)
      .orderBy(desc(count()))
      .limit(5),
    db
      .select({
        requestCount: count(requests.id),
        estimateSum: sql<string>`coalesce(sum(${requestItems.estimate}), 0)`,
      })
      .from(requests)
      .leftJoin(requestItems, sql`${requestItems.requestId} = ${requests.id}`),
    db.select().from(requests).orderBy(desc(requests.createdAt)).limit(5),
  ]);

  const statusMap = new Map(statusCounts.map((s) => [s.status, s.total]));
  const totalRequests = totals[0]?.requestCount ?? 0;
  const estimateSum = Number(totals[0]?.estimateSum ?? 0);

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-navy">Дашборд</h1>

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatTile label="Всего заявок" value={String(totalRequests)} />
        <StatTile
          label="Новые"
          value={String(statusMap.get("new") ?? 0)}
        />
        <StatTile
          label="В производстве"
          value={String(statusMap.get("in_production") ?? 0)}
        />
        <StatTile
          label="Сумма по оценкам заявок"
          value={estimateSum > 0 ? formatSum(estimateSum) : "—"}
        />
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-navy/10 bg-white p-5">
          <h2 className="text-sm font-semibold text-navy">
            Заявки по статусам
          </h2>
          <ul className="mt-3 flex flex-col gap-2">
            {REQUEST_STATUSES.map((s) => (
              <li key={s} className="flex items-center justify-between text-sm">
                <StatusBadge status={s} />
                <span className="font-medium text-navy">
                  {statusMap.get(s) ?? 0}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-navy/10 bg-white p-5">
          <h2 className="text-sm font-semibold text-navy">
            Товары по категориям
          </h2>
          <ul className="mt-3 flex flex-col gap-2">
            {categoryCounts.map((c) => (
              <li
                key={c.categoryName}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-navy/70">{c.categoryName}</span>
                <span className="font-medium text-navy">{c.total}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-navy/10 bg-white p-5">
          <h2 className="text-sm font-semibold text-navy">
            Популярные модели (по заявкам)
          </h2>
          {topProducts.length === 0 ? (
            <p className="mt-2 text-sm text-navy/40">Пока нет данных.</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {topProducts.map((p) => (
                <li
                  key={p.productName}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-navy/70">{p.productName}</span>
                  <span className="font-medium text-navy">{p.total}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-navy/10 bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-navy">
              Последние заявки
            </h2>
            <Link
              href="/admin/requests"
              className="text-xs font-medium text-navy/60 hover:text-navy hover:underline"
            >
              Все заявки →
            </Link>
          </div>
          {recentRequests.length === 0 ? (
            <p className="mt-2 text-sm text-navy/40">Заявок пока нет.</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {recentRequests.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/admin/requests/${r.id}`}
                    className="flex items-center justify-between text-sm hover:underline"
                  >
                    <span className="text-navy/70">{r.customerName}</span>
                    <StatusBadge status={r.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-navy/10 bg-white p-4">
      <p className="font-heading text-2xl font-bold text-navy">{value}</p>
      <p className="mt-1 text-xs text-navy/50">{label}</p>
    </div>
  );
}
