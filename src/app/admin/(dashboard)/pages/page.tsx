import Link from "next/link";
import { getAllPages } from "@/lib/data";
import { PageHeader } from "@/components/admin/page-header";
import { PageIcon, ArrowRightIcon } from "@/components/admin/icons";

export const dynamic = "force-dynamic";

export default async function AdminPagesPage() {
  const pages = await getAllPages();

  return (
    <div>
      <PageHeader
        title="Страницы"
        description="Текстовые блоки статических страниц сайта"
      />

      <div className="mt-6 overflow-hidden rounded-xl border border-navy/10 bg-white shadow-sm">
        {pages.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <PageIcon className="h-8 w-8 text-navy/20" />
            <p className="text-sm text-navy/40">Страниц пока нет.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-navy/10 bg-navy/[0.02] text-left text-xs uppercase tracking-wide text-navy/50">
              <tr>
                <th className="px-5 py-3 font-medium">Страница</th>
                <th className="px-5 py-3 font-medium">Адрес</th>
                <th className="px-5 py-3 font-medium">Блоков</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {pages.map((p) => (
                <tr
                  key={p.id}
                  className="group border-b border-navy/5 transition last:border-0 hover:bg-navy/[0.02]"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-navy/[0.06] text-navy/50">
                        <PageIcon className="h-[18px] w-[18px]" />
                      </span>
                      <span className="font-medium text-navy">{p.title}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs text-navy/50">
                    /{p.slug}
                  </td>
                  <td className="px-5 py-3.5 text-navy/60">
                    {p.blocks.length}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link
                      href={`/admin/pages/${p.slug}`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-navy/50 transition hover:text-navy"
                    >
                      Редактировать
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
