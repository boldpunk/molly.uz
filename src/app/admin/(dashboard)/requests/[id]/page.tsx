import Link from "next/link";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { requests, requestItems, employees } from "@/db/schema";
import { formatSum } from "@/lib/format";
import { REQUEST_STATUS_LABELS } from "@/lib/types";
import { StatusBadge } from "@/components/admin/status-badge";
import { updateRequest, deleteRequest } from "@/lib/admin-actions";
import { DeleteButton } from "@/components/admin/delete-button";
import { FormSection } from "@/components/admin/form-section";
import { ArrowRightIcon, InboxIcon } from "@/components/admin/icons";

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [request] = await db
    .select()
    .from(requests)
    .where(eq(requests.id, id))
    .limit(1);
  if (!request) notFound();

  const items = await db
    .select()
    .from(requestItems)
    .where(eq(requestItems.requestId, id));

  let managerName: string | null = null;
  if (request.assignedManagerId) {
    const [mgr] = await db
      .select({ name: employees.name })
      .from(employees)
      .where(eq(employees.id, request.assignedManagerId))
      .limit(1);
    managerName = mgr?.name ?? null;
  }

  const updateWithId = updateRequest.bind(null, id);
  const deleteWithId = deleteRequest.bind(null, id);

  return (
    <div className="max-w-5xl">
      <Link
        href="/admin/requests"
        className="mb-3 inline-flex items-center gap-1 text-xs font-medium text-navy/50 hover:text-navy"
      >
        <ArrowRightIcon className="h-3.5 w-3.5 rotate-180" />
        Заявки
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-navy/[0.06] font-heading text-lg font-bold text-navy/60">
            {request.customerName.charAt(0).toUpperCase()}
          </span>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-heading text-2xl font-bold text-navy">
                {request.customerName}
              </h1>
              <StatusBadge status={request.status} />
              {request.orderNumber && (
                <span className="rounded-full bg-navy/5 px-2.5 py-1 text-xs font-semibold text-navy/60">
                  {request.orderNumber}
                </span>
              )}
            </div>
            <a
              href={`tel:${request.customerPhone}`}
              className="mt-0.5 block text-sm text-navy/50 hover:text-navy hover:underline"
            >
              {request.customerPhone}
            </a>
          </div>
        </div>
        <DeleteButton action={deleteWithId} label="Удалить заявку" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <FormSection title="Сведения о заказе">
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <InfoRow label="Источник" value={request.source} />
              <InfoRow
                label="Менеджер"
                value={managerName ?? "— (назначится автоматически в Telegram)"}
              />
              {request.totalAmount && (
                <InfoRow label="Сумма заказа" value={formatSum(request.totalAmount)} />
              )}
              {request.depositAmount && (
                <InfoRow label="Залог" value={formatSum(request.depositAmount)} />
              )}
              {request.paidAmount && (
                <InfoRow label="Оплачено" value={formatSum(request.paidAmount)} />
              )}
              {request.productionStartedAt && (
                <InfoRow
                  label="В производстве с"
                  value={new Date(request.productionStartedAt).toLocaleDateString("ru-RU")}
                />
              )}
            </div>
          </FormSection>

          <FormSection title="Товары в заявке">
            {items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <InboxIcon className="h-6 w-6 text-navy/20" />
                <p className="text-sm text-navy/40">Без товаров.</p>
              </div>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-4 rounded-lg border border-navy/10 bg-navy/[0.015] px-3.5 py-2.5 text-sm"
                  >
                    <div>
                      <p className="font-medium text-navy">
                        {item.productName}
                      </p>
                      <p className="mt-0.5 text-xs text-navy/50">
                        {[
                          item.hardwareLabel,
                          item.colourLabel,
                          item.widthMetres
                            ? `${item.widthMetres.toFixed(1)} м`
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" · ") || "—"}
                      </p>
                    </div>
                    {item.estimate && (
                      <p className="shrink-0 text-sm font-semibold text-navy">
                        ≈ {formatSum(item.estimate)}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </FormSection>

          <form action={updateWithId}>
            <FormSection
              title="Заметки"
              description="Статус и сумма заказа управляются через Telegram-бота Mebelflow"
            >
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-navy">Заметки</span>
                <textarea
                  name="notes"
                  defaultValue={request.notes}
                  rows={3}
                  className="input"
                />
              </label>

              <div>
                <button
                  type="submit"
                  className="rounded-full bg-navy px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-navy/90 hover:shadow"
                >
                  Сохранить
                </button>
              </div>
            </FormSection>
          </form>
        </div>

        <div className="rounded-xl border border-navy/10 bg-white p-6 shadow-sm lg:col-span-1">
          <h2 className="text-sm font-semibold text-navy">История статусов</h2>
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
                      {entry.note && (
                        <span className="ml-1.5 text-xs font-normal text-navy/50">
                          {entry.note}
                        </span>
                      )}
                    </p>
                    {entry.amount && (
                      <p className="text-xs font-medium text-accent-dark">
                        {formatSum(entry.amount)}
                      </p>
                    )}
                    <p className="text-xs text-navy/40">
                      {new Date(entry.changedAt).toLocaleString("ru-RU")}
                      {entry.employeeName && ` · ${entry.employeeName}`}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-navy/40">
        {label}
      </p>
      <p className="mt-0.5 font-medium text-navy">{value}</p>
    </div>
  );
}
