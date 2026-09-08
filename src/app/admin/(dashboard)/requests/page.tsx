import Link from "next/link";
import { desc, eq, count } from "drizzle-orm";
import { db } from "@/db";
import { requests, requestItems } from "@/db/schema";
import { StatusBadge } from "@/components/admin/status-badge";
import { REQUEST_STATUSES, REQUEST_STATUS_LABELS, RequestStatus } from "@/lib/types";
import { PageHeader } from "@/components/admin/page-header";
import { ArrowRightIcon, RequestsIcon } from "@/components/admin/icons";

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
      <PageHeader
        title="Заявки"
        description={`${rows.length} ${
          rows.length === 1 ? "заявка" : "заявок"
        }${activeStatus ? ` · ${REQUEST_STATUS_LABELS[activeStatus]}` : ""}`}
        action={{ href: "/admin/requests/new", label: "Новый заказ" }}
      />

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/admin/requests"
          className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
            !activeStatus
              ? "bg-navy text-white shadow-sm"
              : "bg-navy/5 text-navy/70 hover:bg-navy/10"
          }`}
        >
          Все
        </Link>
        {REQUEST_STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/requests?status=${s}`}
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
              activeStatus === s
                ? "bg-navy text-white shadow-sm"
                : "bg-navy/5 text-navy/70 hover:bg-navy/10"
            }`}
          >
            {REQUEST_STATUS_LABELS[s]}
          </Link>
        ))}
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-navy/10 bg-white shadow-sm">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <RequestsIcon className="h-8 w-8 text-navy/20" />
            <p className="text-sm text-navy/40">Заявок нет.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-navy/10 bg-navy/[0.02] text-left text-xs uppercase tracking-wide text-navy/50">
              <tr>
                <th className="px-5 py-3 font-medium">Клиент</th>
                <th className="px-5 py-3 font-medium">Телефон</th>
                <th className="px-5 py-3 font-medium">Товары</th>
                <th className="px-5 py-3 font-medium">Статус</th>
                <th className="px-5 py-3 font-medium">Дата</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map(({ request: r, itemCount }) => (
                <tr
                  key={r.id}
                  className="group border-b border-navy/5 transition last:border-0 hover:bg-navy/[0.02]"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy/[0.06] text-xs font-semibold text-navy/60">
                        {r.customerName.charAt(0).toUpperCase()}
                      </span>
                      <div>
                        <span className="font-medium text-navy">
                          {r.customerName}
                        </span>
                        {r.orderNumber && (
                          <span className="ml-1.5 text-xs text-navy/40">
                            {r.orderNumber}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-navy/60">
                    {r.customerPhone}
                  </td>
                  <td className="px-5 py-3.5 text-navy/60">{itemCount}</td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-5 py-3.5 text-navy/60">
                    {new Date(r.createdAt).toLocaleDateString("ru-RU")}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link
                      href={`/admin/requests/${r.id}`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-navy/50 transition hover:text-navy"
                    >
                      Открыть
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
