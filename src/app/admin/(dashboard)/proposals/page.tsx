import Link from "next/link";
import {
  getProposals,
  PROPOSAL_STATUS_LABELS,
  type ProposalStatus,
} from "@/lib/proposals";
import { createProposal } from "@/lib/proposal-actions";
import { formatMoney } from "@/lib/proposal-money";
import {
  formatProposalDate,
  PROPOSAL_LANGUAGE_LABELS,
} from "@/lib/proposal-i18n";
import { PageHeader } from "@/components/admin/page-header";
import { PlusIcon } from "@/components/admin/icons";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<ProposalStatus, string> = {
  draft: "bg-navy/10 text-navy",
  ready: "bg-sky-100 text-sky-800",
  sent: "bg-accent/20 text-accent-dark",
  accepted: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-700",
  archived: "bg-navy/5 text-navy/50",
};

function StatusPill({ status }: { status: ProposalStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[status]}`}
    >
      {PROPOSAL_STATUS_LABELS[status]}
    </span>
  );
}

export default async function AdminProposalsPage() {
  const proposals = await getProposals();
  const active = proposals.filter((p) => p.status !== "archived");
  const archived = proposals.filter((p) => p.status === "archived");

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          title="Коммерческие предложения"
          description="Премиальные КП для клиентов: изделия, расчёт, PDF и печать"
        />
        <div className="flex items-center gap-2">
          <Link
            href="/admin/proposals/templates"
            className="rounded-full border border-navy/15 px-4 py-2.5 text-sm font-medium text-navy/70 transition hover:bg-navy/5"
          >
            Библиотека текстов
          </Link>
          <form action={createProposal}>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-full bg-navy px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-navy/90"
            >
              <PlusIcon />
              Создать КП
            </button>
          </form>
        </div>
      </div>

      {proposals.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-navy/15 bg-white p-12 text-center">
          <p className="text-sm text-navy/60">
            Пока нет ни одного коммерческого предложения.
          </p>
          <p className="mt-1 text-sm text-navy/40">
            Нажмите «Создать КП», чтобы собрать первое.
          </p>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-8">
          <ProposalTable rows={active} />
          {archived.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-semibold text-navy/50">
                Архив
              </h2>
              <ProposalTable rows={archived} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ProposalTable({
  rows,
}: {
  rows: Awaited<ReturnType<typeof getProposals>>;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-navy/15 bg-white p-8 text-center text-sm text-navy/50">
        Нет активных КП — все в архиве.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-navy/10 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[56rem] text-sm">
          <thead>
            <tr className="border-b border-navy/10 bg-navy/[0.02] text-left text-xs font-semibold uppercase tracking-wide text-navy/40">
              <th className="px-4 py-3">№ КП</th>
              <th className="px-4 py-3">Дата</th>
              <th className="px-4 py-3">Клиент</th>
              <th className="px-4 py-3">Проект</th>
              <th className="px-4 py-3 text-right">Сумма</th>
              <th className="px-4 py-3">Язык</th>
              <th className="px-4 py-3">Статус</th>
              <th className="px-4 py-3">Ответственный</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-navy/5 last:border-0 hover:bg-navy/[0.02]"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/proposals/${row.id}`}
                    className="font-mono text-xs font-semibold text-navy hover:underline"
                  >
                    {row.number}
                  </Link>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-navy/60">
                  {formatProposalDate(row.proposalDate)}
                </td>
                <td className="px-4 py-3 text-navy">
                  {row.clientName || <span className="text-navy/30">—</span>}
                </td>
                <td className="px-4 py-3 text-navy/60">
                  {row.projectName || <span className="text-navy/30">—</span>}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-navy">
                  {formatMoney(row.totalMinor, row.currency)}
                </td>
                <td className="px-4 py-3 text-navy/50">
                  {PROPOSAL_LANGUAGE_LABELS[row.language]}
                </td>
                <td className="px-4 py-3">
                  <StatusPill status={row.status} />
                </td>
                <td className="px-4 py-3 text-navy/60">
                  {row.preparedByName || <span className="text-navy/30">—</span>}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <Link
                    href={`/admin/proposals/${row.id}`}
                    className="text-xs font-medium text-navy/60 hover:text-navy"
                  >
                    Открыть
                  </Link>
                  <span className="px-2 text-navy/20">·</span>
                  <Link
                    href={`/admin/proposals/${row.id}/preview`}
                    className="text-xs font-medium text-navy/60 hover:text-navy"
                  >
                    PDF
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
