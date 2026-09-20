import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getProposal,
  getBrandDirectory,
  getCustomerOptions,
  getTextTemplates,
} from "@/lib/proposals";
import { duplicateProposal, deleteProposal } from "@/lib/proposal-actions";
import { PageHeader } from "@/components/admin/page-header";
import { ProposalEditor } from "@/components/admin/proposal-editor";
import { DeleteButton } from "@/components/admin/delete-button";

export const dynamic = "force-dynamic";

export default async function AdminProposalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [proposal, customers, brandDirectory, templates] = await Promise.all([
    getProposal(id),
    getCustomerOptions(),
    getBrandDirectory(),
    getTextTemplates({ activeOnly: true }),
  ]);

  if (!proposal) notFound();

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          title={`КП ${proposal.number}`}
          description={
            proposal.projectName ||
            "Заполните заказчика, изделия и финальный текст"
          }
          back={{ href: "/admin/proposals", label: "Все КП" }}
        />
        <div className="flex flex-wrap items-center gap-2">
          {proposal.sourceRequestId && (
            <Link
              href={`/admin/requests/${proposal.sourceRequestId}`}
              className="rounded-full border border-navy/15 px-4 py-2 text-sm font-medium text-navy/70 transition hover:bg-navy/5"
            >
              Исходная заявка
            </Link>
          )}
          <form action={duplicateProposal.bind(null, proposal.id)}>
            <button
              type="submit"
              className="rounded-full border border-navy/15 px-4 py-2 text-sm font-medium text-navy/70 transition hover:bg-navy/5"
            >
              Дублировать
            </button>
          </form>
          <DeleteButton
            action={deleteProposal.bind(null, proposal.id)}
            label="Удалить КП"
          />
        </div>
      </div>

      <ProposalEditor
        proposal={proposal}
        customers={customers}
        brandDirectory={brandDirectory}
        templates={templates}
      />
    </div>
  );
}
