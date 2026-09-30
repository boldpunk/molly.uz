import Link from "next/link";
import { getCustomerList } from "@/lib/admin-customers";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { ArrowRightIcon, CustomersIcon } from "@/components/admin/icons";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const list = await getCustomerList(q);

  return (
    <div>
      <PageHeader
        title="Клиенты"
        description="Все, кто оставлял заявки или зарегистрировался на сайте — сгруппированы по номеру телефона."
      />

      <form action="/admin/customers" className="mt-6 flex max-w-xl items-center gap-2 rounded-full bg-white py-1.5 pl-5 pr-1.5 ring-1 ring-navy/10 focus-within:ring-navy/30">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Имя или телефон"
          className="w-full bg-transparent py-1.5 text-sm text-navy outline-none placeholder:text-navy/40"
        />
        <button type="submit" className="rounded-full bg-navy px-4 py-2 text-xs font-semibold text-white hover:bg-navy-light">
          Найти
        </button>
      </form>

      <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-navy/[0.07] bg-white">
        {list.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <CustomersIcon className="h-8 w-8 text-navy/20" />
            <p className="text-sm text-navy/45">{q ? "Никого не нашли." : "Клиентов пока нет."}</p>
          </div>
        ) : (
          <ul className="divide-y divide-navy/5">
            {list.map((c) => (
              <li key={c.digits}>
                <Link
                  href={`/admin/customers/${c.digits}`}
                  className="group grid items-center gap-3 px-5 py-4 transition hover:bg-cream-light/60 sm:grid-cols-[1.4fr_1fr_auto_auto]"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cream font-bold text-accent-dark">
                      {c.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-navy group-hover:text-clay">{c.name}</span>
                      <span className="block text-xs text-navy/50">{c.phone}</span>
                    </span>
                  </span>
                  <span className="flex flex-wrap gap-1.5">
                    {c.registered && (
                      <span className="rounded-full bg-sage-light px-2.5 py-1 text-[11px] font-semibold text-[#4f6349]">Аккаунт</span>
                    )}
                    {c.telegram && (
                      <span className="rounded-full bg-[#e3f4fd] px-2.5 py-1 text-[11px] font-semibold text-[#1d8ecb]">Telegram</span>
                    )}
                    <span className="rounded-full bg-navy/5 px-2.5 py-1 text-[11px] font-semibold text-navy/70">
                      Заявок: {c.requestCount}
                    </span>
                  </span>
                  <span>{c.lastStatus ? <StatusBadge status={c.lastStatus} /> : <span className="text-xs text-navy/40">без заявок</span>}</span>
                  <span className="hidden text-right text-xs text-navy/45 sm:block">
                    {c.lastActivity.toLocaleDateString("ru-RU", { timeZone: "Asia/Tashkent" })}
                    <ArrowRightIcon className="ml-2 inline h-3.5 w-3.5 text-navy/30 group-hover:text-navy" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
