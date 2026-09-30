import Link from "next/link";
import { count, sql, desc, gte } from "drizzle-orm";
import { db } from "@/db";
import { requests, requestItems, products, categories, customers } from "@/db/schema";
import { formatSum } from "@/lib/format";
import { REQUEST_STATUSES, type RequestStatus } from "@/lib/types";
import { getCurrentAdmin } from "@/lib/admin-users";
import { StatusBadge, statusText } from "@/components/admin/status-badge";
import {
  RequestsIcon,
  ProductsIcon,
  ProposalsIcon,
  ArrowRightIcon,
  InboxIcon,
  PlusIcon,
  ExternalIcon,
} from "@/components/admin/icons";

export const dynamic = "force-dynamic";

const TZ = "Asia/Tashkent";
const DAYS = 30;

// Stages a manager is actively working on, between "new" and money.
const IN_TALKS: RequestStatus[] = ["contacted", "meeting_scheduled", "meeting_done", "purchase_request"];

function greeting(): string {
  const hour = Number(
    new Intl.DateTimeFormat("ru-RU", { hour: "numeric", hour12: false, timeZone: TZ }).format(new Date())
  );
  if (hour < 5) return "Доброй ночи";
  if (hour < 12) return "Доброе утро";
  if (hour < 18) return "Добрый день";
  return "Добрый вечер";
}

function dayKey(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d);
}

/** The last DAYS calendar days (Tashkent time), oldest first. */
function dayWindow(): { since: Date; dates: Date[] } {
  const now = Date.now();
  const since = new Date(now - (DAYS - 1) * 86_400_000);
  since.setUTCHours(0, 0, 0, 0);
  const dates = Array.from({ length: DAYS }, (_, i) => new Date(now - (DAYS - 1 - i) * 86_400_000));
  return { since, dates };
}

function todayLabel(): string {
  return new Intl.DateTimeFormat("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: TZ,
  }).format(new Date());
}

export default async function AdminDashboardPage() {
  const { since, dates } = dayWindow();

  const [admin, statusCounts, categoryCounts, topProducts, money, recentRequests, daily, sources, customerTotal] =
    await Promise.all([
      getCurrentAdmin(),
      db.select({ status: requests.status, total: count() }).from(requests).groupBy(requests.status),
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
          estimate: sql<string>`coalesce((select sum(${requestItems.estimate}) from ${requestItems}), 0)`,
          received: sql<string>`coalesce(sum(coalesce(${requests.paidAmount}, ${requests.depositAmount})), 0)`,
        })
        .from(requests),
      db.select().from(requests).orderBy(desc(requests.createdAt)).limit(6),
      db
        .select({
          day: sql<string>`to_char(${requests.createdAt} at time zone 'UTC' at time zone ${TZ}, 'YYYY-MM-DD')`,
          total: count(),
        })
        .from(requests)
        .where(gte(requests.createdAt, since))
        .groupBy(sql`1`),
      db
        .select({ source: requests.source, total: count() })
        .from(requests)
        .groupBy(requests.source)
        .orderBy(desc(count())),
      db.select({ total: count() }).from(customers),
    ]);

  const statusMap = new Map(statusCounts.map((s) => [s.status, s.total]));
  const totalRequests = statusCounts.reduce((sum, s) => sum + s.total, 0);
  const newCount = statusMap.get("new_order") ?? 0;
  const inTalks = IN_TALKS.reduce((sum, s) => sum + (statusMap.get(s) ?? 0), 0);
  const inProduction = (statusMap.get("in_production") ?? 0) + (statusMap.get("ready_shipment") ?? 0);
  const received = Number(money[0]?.received ?? 0);
  const estimate = Number(money[0]?.estimate ?? 0);
  const totalProducts = categoryCounts.reduce((sum, c) => sum + c.total, 0);

  const dailyMap = new Map(daily.map((d) => [d.day, d.total]));
  const days = dates.map((d) => {
    const key = dayKey(d);
    return { key, date: d, total: dailyMap.get(key) ?? 0 };
  });
  const maxDay = Math.max(1, ...days.map((d) => d.total));
  const last30 = days.reduce((sum, d) => sum + d.total, 0);
  const last7 = days.slice(-7).reduce((sum, d) => sum + d.total, 0);
  const maxStatus = Math.max(1, ...REQUEST_STATUSES.map((s) => statusMap.get(s) ?? 0));

  const today = todayLabel();

  return (
    <div className="flex flex-col gap-6">
      {/* Greeting */}
      <section className="relative overflow-hidden rounded-[1.75rem] bg-navy px-6 py-7 text-white sm:px-8">
        <div aria-hidden className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-clay/25 blur-3xl" />
        <div aria-hidden className="absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-sage/20 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cream/55 first-letter:uppercase">{today}</p>
            <h1 className="mt-2 font-heading text-2xl font-bold tracking-tight sm:text-3xl">
              {greeting()}, {admin?.name.split(" ")[0] ?? "коллега"}
            </h1>
            <p className="mt-1.5 text-sm text-white/65">
              {newCount > 0
                ? `${newCount} ${newCount === 1 ? "новая заявка ждёт" : "новых заявок ждут"} ответа.`
                : "Новых заявок без ответа нет."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { href: "/admin/requests/new", label: "Новый заказ", icon: PlusIcon },
              { href: "/admin/proposals", label: "КП", icon: ProposalsIcon },
              { href: "/admin/products/new", label: "Товар", icon: ProductsIcon },
            ].map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2.5 text-sm font-semibold backdrop-blur transition hover:bg-white hover:text-navy"
              >
                <a.icon className="h-4 w-4" />
                {a.label}
              </Link>
            ))}
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-2 rounded-full bg-clay px-4 py-2.5 text-sm font-semibold transition hover:bg-white hover:text-navy"
            >
              Сайт
              <ExternalIcon className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Новые заявки" value={String(newCount)} hint="ждут первого звонка" tone="clay" href="/admin/requests?status=new_order" />
        <Kpi label="В работе" value={String(inTalks)} hint="звонок, встреча, покупка" tone="info" href="/admin/requests" />
        <Kpi label="В производстве" value={String(inProduction)} hint="включая готовые к отгрузке" tone="navy" href="/admin/requests?status=in_production" />
        <Kpi
          label={received > 0 ? "Получено оплат" : "Сумма оценок"}
          value={received > 0 ? formatSum(received) : estimate > 0 ? formatSum(estimate) : "—"}
          hint={received > 0 ? "залоги и полные оплаты" : "по калькулятору на сайте"}
          tone="sage"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* Requests over time */}
        <Card
          title="Заявки за 30 дней"
          aside={
            <div className="flex gap-4 text-right">
              <div>
                <p className="font-heading text-xl font-bold text-navy">{last7}</p>
                <p className="text-[11px] text-navy/45">за неделю</p>
              </div>
              <div>
                <p className="font-heading text-xl font-bold text-navy">{last30}</p>
                <p className="text-[11px] text-navy/45">за месяц</p>
              </div>
            </div>
          }
        >
          {last30 === 0 ? (
            <Empty text="Здесь появится график, как только придут первые заявки." />
          ) : (
            <div className="mt-2">
              <div className="flex h-44 items-end gap-[3px]">
                {days.map((d) => (
                  <div key={d.key} className="group relative flex h-full flex-1 flex-col justify-end">
                    <div
                      className={`w-full rounded-t-md transition ${
                        d.total > 0 ? "bg-navy group-hover:bg-clay" : "bg-navy/[0.06]"
                      }`}
                      style={{ height: d.total > 0 ? `${Math.max(6, (d.total / maxDay) * 100)}%` : "4px" }}
                    />
                    <span className="pointer-events-none absolute -top-8 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-navy px-2 py-1 text-[11px] font-semibold text-white group-hover:block">
                      {d.date.toLocaleDateString("ru-RU", { day: "numeric", month: "short", timeZone: TZ })}: {d.total}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex justify-between text-[11px] text-navy/40">
                {[0, 10, 20, DAYS - 1].map((i) => (
                  <span key={i}>
                    {days[i].date.toLocaleDateString("ru-RU", { day: "numeric", month: "short", timeZone: TZ })}
                  </span>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Sources */}
        <Card title="Откуда приходят заявки">
          {sources.length === 0 ? (
            <Empty text="Пока нет данных." />
          ) : (
            <ul className="flex flex-col gap-3">
              {sources.map((s, i) => (
                <li key={s.source}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-navy/75">{s.source}</span>
                    <span className="font-semibold text-navy">{s.total}</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-navy/[0.06]">
                    <div
                      className={`h-full rounded-full ${["bg-clay", "bg-navy", "bg-sage", "bg-accent-dark"][i % 4]}`}
                      style={{ width: `${(s.total / Math.max(1, totalRequests)) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Funnel */}
        <Card title="Воронка по статусам" aside={<span className="text-xs text-navy/45">{totalRequests} всего</span>}>
          <ul className="flex flex-col gap-1">
            {REQUEST_STATUSES.map((s) => {
              const n = statusMap.get(s) ?? 0;
              return (
                <li key={s}>
                  <Link
                    href={`/admin/requests?status=${s}`}
                    className="group grid grid-cols-[10.5rem_1fr_2rem] items-center gap-3 rounded-xl px-2 py-1.5 text-sm transition hover:bg-navy/[0.03]"
                  >
                    <span className="truncate text-navy/75 group-hover:text-navy">{statusText(s)}</span>
                    <span className="h-2 overflow-hidden rounded-full bg-navy/[0.05]">
                      <span className="block h-full rounded-full bg-navy/80 transition group-hover:bg-clay" style={{ width: `${(n / maxStatus) * 100}%` }} />
                    </span>
                    <span className="text-right font-semibold text-navy">{n}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>

        {/* Recent */}
        <Card
          title="Последние заявки"
          aside={
            <Link href="/admin/requests" className="inline-flex items-center gap-1 text-xs font-semibold text-navy/55 hover:text-navy">
              Все <ArrowRightIcon className="h-3 w-3" />
            </Link>
          }
        >
          {recentRequests.length === 0 ? (
            <Empty text="Заявок пока нет — первая появится здесь сразу после отправки с сайта или из бота." />
          ) : (
            <ul className="flex flex-col divide-y divide-navy/5">
              {recentRequests.map((r) => (
                <li key={r.id}>
                  <Link href={`/admin/requests/${r.id}`} className="flex items-center justify-between gap-3 rounded-xl px-2 py-2.5 transition hover:bg-navy/[0.03]">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-navy">{r.customerName}</span>
                      <span className="block text-xs text-navy/45">
                        {r.orderNumber ?? "без номера"} ·{" "}
                        {r.createdAt.toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: TZ })}
                      </span>
                    </span>
                    <StatusBadge status={r.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Популярные модели">
          {topProducts.length === 0 ? (
            <Empty text="Пока нет данных." />
          ) : (
            <ol className="flex flex-col gap-1">
              {topProducts.map((p, i) => (
                <li key={p.productName} className="flex items-center gap-3 rounded-xl px-2 py-2 text-sm">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cream text-[11px] font-bold text-accent-dark">
                    {i + 1}
                  </span>
                  <span className="flex-1 truncate text-navy/75">{p.productName}</span>
                  <span className="font-semibold text-navy">{p.total}</span>
                </li>
              ))}
            </ol>
          )}
        </Card>
        <Card title="Каталог" aside={<span className="text-xs text-navy/45">{totalProducts} товаров</span>}>
          <ul className="flex flex-col gap-1">
            {categoryCounts.map((c) => (
              <li key={c.categoryName} className="flex items-center justify-between rounded-xl px-2 py-2 text-sm">
                <span className="text-navy/75">{c.categoryName}</span>
                <span className="font-semibold text-navy">{c.total}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Клиенты">
          <p className="font-heading text-4xl font-bold text-navy">{customerTotal[0]?.total ?? 0}</p>
          <p className="mt-1 text-sm text-navy/55">зарегистрировано на сайте</p>
          <Link
            href="/admin/customers"
            className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-navy/5 px-4 py-2 text-sm font-semibold text-navy transition hover:bg-navy hover:text-white"
          >
            Все клиенты <ArrowRightIcon className="h-3.5 w-3.5" />
          </Link>
        </Card>
      </div>
    </div>
  );
}

const KPI_TONES = {
  clay: "bg-clay-light text-clay",
  info: "bg-[#e3eef3] text-info",
  navy: "bg-navy/10 text-navy",
  sage: "bg-sage-light text-sage",
} as const;

function Kpi({
  label,
  value,
  hint,
  tone,
  href,
}: {
  label: string;
  value: string;
  hint: string;
  tone: keyof typeof KPI_TONES;
  href?: string;
}) {
  const body = (
    <>
      <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${KPI_TONES[tone]}`}>
        <RequestsIcon className="h-[18px] w-[18px]" />
      </span>
      <p className="mt-4 truncate font-heading text-2xl font-bold tracking-tight text-navy sm:text-[28px]">{value}</p>
      <p className="mt-0.5 text-sm font-semibold text-navy/80">{label}</p>
      <p className="text-xs text-navy/45">{hint}</p>
    </>
  );
  const cls =
    "block rounded-[1.5rem] border border-navy/[0.07] bg-white p-5 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-navy/[0.07]";
  return href ? (
    <Link href={href} className={cls}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

function Card({ title, aside, children }: { title: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-[1.5rem] border border-navy/[0.07] bg-white p-5 sm:p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <h2 className="font-heading text-base font-bold text-navy">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-center">
      <InboxIcon className="h-7 w-7 text-navy/20" />
      <p className="max-w-xs text-sm text-navy/45">{text}</p>
    </div>
  );
}
