import Link from "next/link";
import { and, desc, eq, count, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { requests, requestItems } from "@/db/schema";
import { StatusBadge, statusText } from "@/components/admin/status-badge";
import { REQUEST_STATUSES, RequestStatus } from "@/lib/types";
import { PageHeader } from "@/components/admin/page-header";
import { ArrowRightIcon, RequestsIcon } from "@/components/admin/icons";

export const dynamic = "force-dynamic";

function plural(n: number, one: string, few: string, many: string) {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}

export default async function AdminRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status, q = "" } = await searchParams;
  const activeStatus = REQUEST_STATUSES.includes(status as RequestStatus)
    ? (status as RequestStatus)
    : undefined;
  const query = q.trim();
  const digits = query.replace(/\D/g, "");

  const search = query
    ? or(
        ilike(requests.customerName, `%${query}%`),
        ilike(requests.orderNumber, `%${query}%`),
        digits.length >= 3
          ? sql`regexp_replace(${requests.customerPhone}, '[^0-9]', '', 'g') like ${`%${digits}%`}`
          : undefined
      )
    : undefined;

  const [rows, statusCounts] = await Promise.all([
    db
      .select({ request: requests, itemCount: count(requestItems.id) })
      .from(requests)
      .leftJoin(requestItems, eq(requestItems.requestId, requests.id))
      .where(and(activeStatus ? eq(requests.status, activeStatus) : undefined, search))
      .groupBy(requests.id)
      .orderBy(desc(requests.createdAt)),
    db.select({ status: requests.status, total: count() }).from(requests).groupBy(requests.status),
  ]);
  const countMap = new Map(statusCounts.map((s) => [s.status, s.total]));
  const all = statusCounts.reduce((sum, s) => sum + s.total, 0);

  const filterHref = (s?: string) => {
    const params = new URLSearchParams();
    if (s) params.set("status", s);
    if (query) params.set("q", query);
    const str = params.toString();
    return `/admin/requests${str ? `?${str}` : ""}`;
  };

  return (
    <div>
      <PageHeader
        title="Заявки"
        description={`${rows.length} ${plural(rows.length, "заявка", "заявки", "заявок")}${
          activeStatus ? ` · ${statusText(activeStatus)}` : ""
        }${query ? ` · поиск «${query}»` : ""}`}
        action={{ href: "/admin/requests/new", label: "Новый заказ" }}
      >
        <a
          href="/api/admin/requests-export"
          className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-navy ring-1 ring-navy/15 transition hover:ring-navy/40"
        >
          Выгрузить CSV
        </a>
      </PageHeader>

      <form action="/admin/requests" className="mt-6 flex max-w-xl items-center gap-2 rounded-full bg-white py-1.5 pl-5 pr-1.5 ring-1 ring-navy/10 focus-within:ring-navy/30">
        {activeStatus && <input type="hidden" name="status" value={activeStatus} />}
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0 text-navy/40" aria-hidden>
          <path d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm10 3-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Имя, телефон или номер заказа"
          className="w-full bg-transparent py-1.5 text-sm text-navy outline-none placeholder:text-navy/40"
        />
        <button type="submit" className="rounded-full bg-navy px-4 py-2 text-xs font-semibold text-white hover:bg-navy-light">
          Найти
        </button>
      </form>

      <div className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <Link
          href={filterHref()}
          className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold transition ${
            !activeStatus ? "bg-navy text-white shadow-md shadow-navy/20" : "bg-white text-navy/70 ring-1 ring-navy/10 hover:ring-navy/30"
          }`}
        >
          Все <span className="opacity-60">{all}</span>
        </Link>
        {REQUEST_STATUSES.map((s) => (
          <Link
            key={s}
            href={filterHref(s)}
            className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold transition ${
              activeStatus === s ? "bg-navy text-white shadow-md shadow-navy/20" : "bg-white text-navy/70 ring-1 ring-navy/10 hover:ring-navy/30"
            }`}
          >
            {statusText(s)} <span className="opacity-60">{countMap.get(s) ?? 0}</span>
          </Link>
        ))}
      </div>

      <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-navy/[0.07] bg-white">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <RequestsIcon className="h-8 w-8 text-navy/20" />
            <p className="text-sm text-navy/45">
              {query || activeStatus ? "Ничего не найдено." : "Заявок пока нет — они появятся здесь, как только клиенты начнут оставлять их на сайте или в боте."}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <table className="hidden w-full text-sm md:table">
              <thead className="border-b border-navy/[0.07] text-left text-[11px] uppercase tracking-[0.12em] text-navy/45">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Клиент</th>
                  <th className="px-5 py-3.5 font-semibold">Телефон</th>
                  <th className="px-5 py-3.5 font-semibold">Источник</th>
                  <th className="px-5 py-3.5 font-semibold">Товары</th>
                  <th className="px-5 py-3.5 font-semibold">Статус</th>
                  <th className="px-5 py-3.5 font-semibold">Дата</th>
                  <th className="px-5 py-3.5" />
                </tr>
              </thead>
              <tbody>
                {rows.map(({ request: r, itemCount }) => (
                  <tr key={r.id} className="group border-b border-navy/5 transition last:border-0 hover:bg-cream-light/60">
                    <td className="px-5 py-3.5">
                      <Link href={`/admin/requests/${r.id}`} className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cream text-xs font-bold text-accent-dark">
                          {r.customerName.charAt(0).toUpperCase()}
                        </span>
                        <span>
                          <span className="block font-semibold text-navy group-hover:text-clay">{r.customerName}</span>
                          {r.orderNumber && <span className="block text-xs text-navy/45">{r.orderNumber}</span>}
                        </span>
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-navy/65">
                      <a href={`tel:${r.customerPhone.replace(/[^+\d]/g, "")}`} className="hover:text-navy">
                        {r.customerPhone}
                      </a>
                    </td>
                    <td className="px-5 py-3.5 text-navy/65">{r.source}</td>
                    <td className="px-5 py-3.5 text-navy/65">{itemCount}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-navy/65">
                      {r.createdAt.toLocaleDateString("ru-RU", { timeZone: "Asia/Tashkent" })}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/admin/requests/${r.id}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-navy/40 transition group-hover:bg-navy group-hover:text-white"
                        aria-label="Открыть заявку"
                      >
                        <ArrowRightIcon className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile cards */}
            <ul className="divide-y divide-navy/5 md:hidden">
              {rows.map(({ request: r, itemCount }) => (
                <li key={r.id}>
                  <Link href={`/admin/requests/${r.id}`} className="flex items-start justify-between gap-3 p-4">
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-navy">{r.customerName}</span>
                      <span className="block text-xs text-navy/50">
                        {r.customerPhone} · {r.source} · {itemCount} тов.
                      </span>
                      <span className="block text-xs text-navy/40">
                        {r.orderNumber ?? "без номера"} · {r.createdAt.toLocaleDateString("ru-RU", { timeZone: "Asia/Tashkent" })}
                      </span>
                    </span>
                    <StatusBadge status={r.status} />
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
