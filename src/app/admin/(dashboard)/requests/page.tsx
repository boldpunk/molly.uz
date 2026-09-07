import Link from "next/link";
import { desc, eq, count } from "drizzle-orm";
import { db } from "@/db";
import { requests, requestItems } from "@/db/schema";
import { StatusBadge } from "@/components/admin/status-badge";
import { REQUEST_STATUSES, REQUEST_STATUS_LABELS, RequestStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const activeStatus = REQUEST_STATUSES.includes(status as RequestStatus)
    ? (status as RequestStatus)
    : undefined;

  const rows = await db
    .select({
      request: requests,
      itemCount: count(requestItems.id),
    })
    .from(requests)
    .leftJoin(requestItems, eq(requestItems.requestId, requests.id))
    .where(activeStatus ? eq(requests.status, activeStatus) : undefined)
    .groupBy(requests.id)
    .orderBy(desc(requests.createdAt));

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-navy">Заявки</h1>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/admin/requests"
          className={`rounded-full px-3 py-1.5 text-xs font-medium ${
            !activeStatus
              ? "bg-navy text-white"
              : "bg-navy/5 text-navy/70 hover:bg-navy/10"
          }`}
        >
          Все
        </Link>
        {REQUEST_STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/requests?status=${s}`}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              activeStatus === s
                ? "bg-navy text-white"
                : "bg-navy/5 text-navy/70 hover:bg-navy/10"
            }`}
          >
            {REQUEST_STATUS_LABELS[s]}
          </Link>
        ))}
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-navy/10 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-navy/10 bg-navy/[0.02] text-left text-xs uppercase tracking-wide text-navy/50">
            <tr>
              <th className="px-4 py-3">Клиент</th>
              <th className="px-4 py-3">Телефон</th>
              <th className="px-4 py-3">Товары</th>
              <th className="px-4 py-3">Статус</th>
              <th className="px-4 py-3">Дата</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map(({ request: r, itemCount }) => (
              <tr key={r.id} className="border-b border-navy/5 last:border-0">
                <td className="px-4 py-3 font-medium text-navy">
                  {r.customerName}
                </td>
                <td className="px-4 py-3 text-navy/60">{r.customerPhone}</td>
                <td className="px-4 py-3 text-navy/60">{itemCount}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={r.status} />
                </td>
                <td className="px-4 py-3 text-navy/60">
                  {new Date(r.createdAt).toLocaleDateString("ru-RU")}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/requests/${r.id}`}
                    className="text-xs font-medium text-navy/60 hover:text-navy hover:underline"
                  >
                    Открыть
                  </Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-navy/40">
                  Заявок нет.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
