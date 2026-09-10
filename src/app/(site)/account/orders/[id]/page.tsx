import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentCustomer, getCustomerRequestDetail } from "@/lib/customers";
import { StatusBadge } from "@/components/admin/status-badge";
import { formatSum } from "@/lib/format";
import { REQUEST_STATUS_LABELS, RequestStatus } from "@/lib/types";

export const metadata = { title: "Заявка — Molly Home" };
export const dynamic = "force-dynamic";

export default async function CustomerOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/account");

  const request = await getCustomerRequestDetail(customer.id, id);
  if (!request) notFound();

  return (
    <div className="mx-auto max-w-2xl px-6 py-14">
      <Link href="/account" className="text-sm font-medium text-navy/50 hover:underline">
        ← Мои заявки
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-navy">
            {request.orderNumber ? `Заявка ${request.orderNumber}` : "Заявка"}
          </h1>
          <p className="mt-1 text-sm text-navy/60">
            {new Date(request.createdAt).toLocaleDateString("ru-RU", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <StatusBadge status={request.status as RequestStatus} />
      </div>

      {(request.totalAmount || request.depositAmount || request.paidAmount) && (
        <div className="mt-6 grid grid-cols-3 gap-3 rounded-xl border border-navy/10 bg-navy/[0.02] p-4 text-center">
          <div>
            <p className="text-xs text-navy/50">Сумма заказа</p>
            <p className="mt-1 text-sm font-semibold text-navy">
              {request.totalAmount ? formatSum(request.totalAmount) : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-navy/50">Залог</p>
            <p className="mt-1 text-sm font-semibold text-navy">
              {request.depositAmount ? formatSum(request.depositAmount) : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-navy/50">Оплачено</p>
            <p className="mt-1 text-sm font-semibold text-navy">
              {request.paidAmount ? formatSum(request.paidAmount) : "—"}
            </p>
          </div>
        </div>
      )}

      <h2 className="font-heading mt-10 text-lg font-bold text-navy">Товары</h2>
      <ul className="mt-4 flex flex-col gap-3">
        {request.items.map((item) => (
          <li
            key={item.id}
            className="rounded-xl border border-navy/10 bg-white p-4"
          >
            <Link
              href={`/catalog/${item.categorySlug}/${item.productSlug}`}
              className="text-sm font-semibold text-navy hover:underline"
            >
              {item.productName}
            </Link>
            <p className="mt-1 text-xs text-navy/60">
              {[
                item.colourLabel,
                item.hardwareLabel,
                item.widthMetres ? `${item.widthMetres} м` : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
            {item.estimate && (
              <p className="mt-1 text-xs font-medium text-accent-dark">
                {formatSum(item.estimate)}
              </p>
            )}
          </li>
        ))}
      </ul>

      {request.notes && (
        <>
          <h2 className="font-heading mt-10 text-lg font-bold text-navy">
            Комментарий
          </h2>
          <p className="mt-3 text-sm text-navy/70">{request.notes}</p>
        </>
      )}

      <h2 className="font-heading mt-10 text-lg font-bold text-navy">
        История статуса
      </h2>
      {request.statusHistory.length === 0 ? (
        <p className="mt-3 text-sm text-navy/40">Пока нет изменений.</p>
      ) : (
        <ol className="mt-4 flex flex-col">
          {[...request.statusHistory].reverse().map((entry, i, arr) => (
            <li key={i} className="relative flex gap-3 pb-5 last:pb-0">
              {i < arr.length - 1 && (
                <span className="absolute left-[5px] top-3 h-full w-px bg-navy/10" />
              )}
              <span
                className={`relative mt-1 h-[11px] w-[11px] shrink-0 rounded-full border-2 border-white ring-2 ${
                  i === 0 ? "bg-accent-dark ring-accent/30" : "bg-navy/20 ring-transparent"
                }`}
              />
              <div>
                <p className="text-sm font-medium text-navy">
                  {REQUEST_STATUS_LABELS[
                    entry.status as keyof typeof REQUEST_STATUS_LABELS
                  ] ?? entry.status}
                </p>
                <p className="text-xs text-navy/40">
                  {new Date(entry.changedAt).toLocaleString("ru-RU")}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
