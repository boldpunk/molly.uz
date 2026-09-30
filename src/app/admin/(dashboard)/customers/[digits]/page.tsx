import Link from "next/link";
import { notFound } from "next/navigation";
import { getCustomerDetail } from "@/lib/admin-customers";
import { saveCustomerNotes } from "@/lib/customer-actions";
import { formatSum } from "@/lib/format";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { ArrowRightIcon } from "@/components/admin/icons";

export const dynamic = "force-dynamic";

export default async function AdminCustomerPage({ params }: { params: Promise<{ digits: string }> }) {
  const { digits } = await params;
  const customer = await getCustomerDetail(digits.replace(/\D/g, ""));
  if (!customer) notFound();

  const tel = `+${customer.digits}`;
  const received = customer.requests.reduce((sum, r) => sum + (r.paidAmount ?? r.depositAmount ?? 0), 0);

  return (
    <div>
      <PageHeader title={customer.name} description={customer.phone} back={{ href: "/admin/customers", label: "Клиенты" }}>
        <a href={`tel:${tel}`} className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-navy ring-1 ring-navy/15 hover:ring-navy/40">
          Позвонить
        </a>
        {customer.account?.telegramId && (
          <a
            href={`tg://user?id=${customer.account.telegramId}`}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#2aabee] px-4 py-2.5 text-sm font-semibold text-white"
          >
            Telegram
          </a>
        )}
      </PageHeader>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_22rem]">
        <section className="rounded-[1.5rem] border border-navy/[0.07] bg-white p-5 sm:p-6">
          <h2 className="font-heading text-base font-bold text-navy">Заявки и заказы</h2>
          {customer.requests.length === 0 ? (
            <p className="mt-4 text-sm text-navy/50">Клиент зарегистрировался, но заявок ещё не оставлял.</p>
          ) : (
            <ul className="mt-4 flex flex-col gap-3">
              {customer.requests.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/admin/requests/${r.id}`}
                    className="group block rounded-2xl border border-navy/[0.07] p-4 transition hover:border-navy/20 hover:shadow-lg hover:shadow-navy/5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold text-navy group-hover:text-clay">
                        {r.orderNumber ?? "Заявка"}{" "}
                        <span className="font-normal text-navy/45">
                          · {r.createdAt.toLocaleDateString("ru-RU", { timeZone: "Asia/Tashkent" })} · {r.source}
                        </span>
                      </span>
                      <StatusBadge status={r.status} />
                    </div>
                    {r.items.length > 0 && (
                      <p className="mt-2 text-sm text-navy/65">{r.items.map((i) => i.productName).join(", ")}</p>
                    )}
                    {r.notes && <p className="mt-1 line-clamp-2 text-xs text-navy/45">{r.notes}</p>}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="flex flex-col gap-4">
          <div className="rounded-[1.5rem] bg-navy p-5 text-white">
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-xs text-cream/55">Заявок</dt>
                <dd className="font-heading text-2xl font-bold">{customer.requests.length}</dd>
              </div>
              <div>
                <dt className="text-xs text-cream/55">Оплачено</dt>
                <dd className="font-heading text-lg font-bold">{received ? formatSum(received) : "—"}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs text-cream/55">Аккаунт на сайте</dt>
                <dd className="text-sm font-semibold">
                  {customer.account
                    ? `с ${customer.account.createdAt.toLocaleDateString("ru-RU", { timeZone: "Asia/Tashkent" })}${
                        customer.account.telegramId ? " · уведомления в Telegram" : ""
                      }`
                    : "нет"}
                </dd>
              </div>
            </dl>
          </div>

          <form action={saveCustomerNotes} className="rounded-[1.5rem] border border-navy/[0.07] bg-white p-5">
            <input type="hidden" name="digits" value={customer.digits} />
            <label htmlFor="notes" className="font-heading text-base font-bold text-navy">
              Заметки о клиенте
            </label>
            <p className="mt-0.5 text-xs text-navy/45">Видят все менеджеры. Например: предпочтения, договорённости.</p>
            <textarea
              id="notes"
              name="notes"
              defaultValue={customer.notes}
              rows={6}
              className="input mt-3 rounded-xl"
              placeholder="Удобно звонить после 18:00, интересуется кухней 3,2 м…"
            />
            <div className="mt-3 flex items-center justify-between gap-2">
              <span className="text-[11px] text-navy/40">
                {customer.notesUpdatedAt
                  ? `Изменено ${customer.notesUpdatedAt.toLocaleString("ru-RU", { timeZone: "Asia/Tashkent" })}`
                  : ""}
              </span>
              <button type="submit" className="rounded-full bg-navy px-4 py-2 text-xs font-semibold text-white hover:bg-navy-light">
                Сохранить
              </button>
            </div>
          </form>

          <Link href="/admin/requests/new" className="inline-flex items-center justify-between rounded-[1.5rem] border border-navy/[0.07] bg-white p-5 text-sm font-semibold text-navy hover:border-navy/20">
            Создать новый заказ
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </aside>
      </div>
    </div>
  );
}
