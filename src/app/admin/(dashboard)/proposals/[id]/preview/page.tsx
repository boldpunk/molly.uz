import { notFound } from "next/navigation";
import { getProposal, getProposalCompanyInfo } from "@/lib/proposals";
import { ProposalDocument } from "@/components/proposal/proposal-document";
import { ProposalToolbar } from "@/components/proposal/proposal-toolbar";

export const dynamic = "force-dynamic";

export default async function ProposalPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [proposal, company] = await Promise.all([
    getProposal(id),
    getProposalCompanyInfo(),
  ]);

  if (!proposal) notFound();

  return (
    <div>
      <ProposalToolbar
        editHref={`/admin/proposals/${proposal.id}`}
        number={proposal.number}
      />
      <div className="overflow-x-auto pb-10">
        <ProposalDocument proposal={proposal} company={company} />
      </div>
    </div>
  );
}
