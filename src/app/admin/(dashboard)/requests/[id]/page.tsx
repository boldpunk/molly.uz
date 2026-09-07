import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { requests, requestItems } from "@/db/schema";
import { formatSum } from "@/lib/format";
import { REQUEST_STATUSES, REQUEST_STATUS_LABELS } from "@/lib/types";
import { StatusBadge } from "@/components/admin/status-badge";
import { updateRequest, deleteRequest } from "@/lib/admin-actions";

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

  const updateWithId = updateRequest.bind(null, id);
  const deleteWithId = deleteRequest.bind(null, id);

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-navy">
            {request.customerName}
          </h1>
          <p className="mt-1 text-sm text-navy/60">{request.customerPhone}</p>
        </div>
        <StatusBadge status={request.status} />
      </div>

      <div className="mt-6 rounded-xl border border-navy/10 bg-white p-5">
        <h2 className="text-sm font-semibold text-navy">Товары в заявке</h2>
        {items.length === 0 ? (
          <p className="mt-2 text-sm text-navy/40">Без товаров.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {items.map((item) => (
              <li
                key={item.id}
                className="rounded-lg border border-navy/10 px-3 py-2 text-sm"
              >
                <p className="font-medium text-navy">{item.productName}</p>
                <p className="mt-0.5 text-xs text-navy/60">
                  {[
                    item.hardwareLabel,
                    item.colourLabel,
                    item.widthMetres ? `${item.widthMetres.toFixed(1)} м` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                {item.estimate && (
                  <p className="mt-1 text-sm font-semibold text-navy">
                    ≈ {formatSum(item.estimate)}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <form action={updateWithId} className="mt-6 flex flex-col gap-4 rounded-xl border border-navy/10 bg-white p-5">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-navy">Статус</span>
          <select name="status" defaultValue={request.status} className="input">
            {REQUEST_STATUSES.map((s) => (
              <option key={s} value={s}>
                {REQUEST_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-navy">Менеджер</span>
          <input
            name="assignedManager"
            defaultValue={request.assignedManager ?? ""}
            placeholder="Кто ведёт заявку"
            className="input"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-navy">Заметки</span>
          <textarea
            name="notes"
            defaultValue={request.notes}
            rows={3}
            className="input"
          />
        </label>

        <button
          type="submit"
          className="w-fit rounded-full bg-navy px-6 py-3 text-sm font-semibold text-white hover:bg-navy/90"
        >
          Сохранить
        </button>
      </form>

      {request.statusHistory.length > 0 && (
        <div className="mt-6 rounded-xl border border-navy/10 bg-white p-5">
          <h2 className="text-sm font-semibold text-navy">История статусов</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {request.statusHistory.map((entry, i) => (
              <li key={i} className="flex items-center gap-3 text-sm">
                <span className="text-navy/40">
                  {new Date(entry.changedAt).toLocaleString("ru-RU")}
                </span>
                <span className="text-navy">
                  {REQUEST_STATUS_LABELS[entry.status as keyof typeof REQUEST_STATUS_LABELS] ??
                    entry.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <form action={deleteWithId} className="mt-6">
        <button
          type="submit"
          className="text-sm font-medium text-red-600 hover:underline"
        >
          Удалить заявку
        </button>
      </form>
    </div>
  );
}
