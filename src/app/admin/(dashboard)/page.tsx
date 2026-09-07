import Link from "next/link";
import { count, sql, desc } from "drizzle-orm";
import { db } from "@/db";
import { requests, requestItems, products, categories } from "@/db/schema";
import { formatSum } from "@/lib/format";
import { REQUEST_STATUSES } from "@/lib/types";
import { StatusBadge } from "@/components/admin/status-badge";
import { PageHeader } from "@/components/admin/page-header";
import {
  RequestsIcon,
  SparkIcon,
  ProductsIcon,
  CategoriesIcon,
  ArrowRightIcon,
  InboxIcon,
} from "@/components/admin/icons";

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
  const totalProducts = categoryCounts.reduce((sum, c) => sum + c.total, 0);

  return (
    <div>
      <PageHeader
        title="Дашборд"
        description="Обзор заявок, каталога и продаж Molly Home"
      />

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatTile
          label="Всего заявок"
          value={String(totalRequests)}
          icon={RequestsIcon}
          tone="navy"
        />
        <StatTile
          label="Новые"
          value={String(statusMap.get("new") ?? 0)}
          icon={SparkIcon}
          tone="sage"
        />
        <StatTile
          label="В производстве"
          value={String(statusMap.get("in_production") ?? 0)}
          icon={ProductsIcon}
          tone="navy"
        />
        <StatTile
          label="Сумма по оценкам заявок"
          value={estimateSum > 0 ? formatSum(estimateSum) : "—"}
          icon={CategoriesIcon}
          tone="sage"
        />
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <SectionCard title="Заявки по статусам" icon={RequestsIcon}>
          <ul className="flex flex-col gap-1">
            {REQUEST_STATUSES.map((s) => (
              <li
                key={s}
                className="flex items-center justify-between rounded-lg px-2 py-2 text-sm transition hover:bg-navy/[0.03]"
              >
                <StatusBadge status={s} />
                <span className="font-semibold text-navy">
                  {statusMap.get(s) ?? 0}
                </span>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard
          title="Товары по категориям"
          icon={CategoriesIcon}
          badge={`${totalProducts} всего`}
        >
          {categoryCounts.length === 0 ? (
            <EmptyRow text="Категорий пока нет." />
          ) : (
            <ul className="flex flex-col gap-1">
              {categoryCounts.map((c) => (
                <li
                  key={c.categoryName}
                  className="flex items-center justify-between rounded-lg px-2 py-2 text-sm transition hover:bg-navy/[0.03]"
                >
                  <span className="text-navy/70">{c.categoryName}</span>
                  <span className="font-semibold text-navy">{c.total}</span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Популярные модели (по заявкам)" icon={SparkIcon}>
          {topProducts.length === 0 ? (
            <EmptyRow text="Пока нет данных." />
          ) : (
            <ul className="flex flex-col gap-1">
              {topProducts.map((p, i) => (
                <li
                  key={p.productName}
                  className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm transition hover:bg-navy/[0.03]"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-navy/[0.06] text-[11px] font-semibold text-navy/50">
                    {i + 1}
                  </span>
                  <span className="flex-1 text-navy/70">{p.productName}</span>
                  <span className="font-semibold text-navy">{p.total}</span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard
          title="Последние заявки"
          icon={RequestsIcon}
          headerAction={
            <Link
              href="/admin/requests"
              className="inline-flex items-center gap-1 text-xs font-medium text-navy/50 hover:text-navy"
            >
              Все заявки
              <ArrowRightIcon className="h-3 w-3" />
            </Link>
          }
        >
          {recentRequests.length === 0 ? (
            <EmptyRow text="Заявок пока нет." />
          ) : (
            <ul className="flex flex-col gap-1">
              {recentRequests.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/admin/requests/${r.id}`}
                    className="flex items-center justify-between rounded-lg px-2 py-2 text-sm transition hover:bg-navy/[0.03]"
                  >
                    <span className="text-navy/70">{r.customerName}</span>
                    <StatusBadge status={r.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "navy" | "sage";
}) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-navy/10 bg-white p-4 transition hover:shadow-md">
      <div
        className={`absolute -right-3 -top-3 flex h-16 w-16 items-center justify-center rounded-full ${
          tone === "sage" ? "bg-sage/10" : "bg-navy/[0.04]"
        }`}
      >
        <Icon
          className={`h-6 w-6 translate-x-2 translate-y-2 ${
            tone === "sage" ? "text-sage-dark" : "text-navy/30"
          }`}
        />
      </div>
      <p className="relative font-heading text-2xl font-bold text-navy">
        {value}
      </p>
      <p className="relative mt-1 text-xs text-navy/50">{label}</p>
    </div>
  );
}

function SectionCard({
  title,
  icon: Icon,
  badge,
  headerAction,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-navy/10 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-navy/[0.06] text-navy/50">
            <Icon className="h-4 w-4" />
          </span>
          <h2 className="text-sm font-semibold text-navy">{title}</h2>
          {badge && (
            <span className="rounded-full bg-navy/[0.06] px-2 py-0.5 text-[11px] font-medium text-navy/50">
              {badge}
            </span>
          )}
        </div>
        {headerAction}
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function EmptyRow({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-6 text-center">
      <InboxIcon className="h-6 w-6 text-navy/20" />
      <p className="text-sm text-navy/40">{text}</p>
    </div>
  );
}
