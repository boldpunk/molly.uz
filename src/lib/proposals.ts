import { asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  commercialProposals,
  commercialProposalItems,
  proposalTextTemplates,
  customers as customersTable,
  adminUsers,
} from "@/db/schema";
import type { ProposalBrand } from "@/db/schema";
import { getContactInfo, getPageBySlug } from "./data";
import { getBrandAssets } from "./brand";
import type {
  Proposal,
  ProposalCompanyInfo,
  ProposalCustomerOption,
  ProposalSummary,
  TextTemplate,
} from "./proposal-types";

export * from "./proposal-types";

export async function getProposals(): Promise<ProposalSummary[]> {
  const rows = await db
    .select({
      id: commercialProposals.id,
      number: commercialProposals.number,
      proposalDate: commercialProposals.proposalDate,
      clientName: commercialProposals.clientName,
      projectName: commercialProposals.projectName,
      language: commercialProposals.language,
      currency: commercialProposals.currency,
      totalMinor: commercialProposals.totalMinor,
      status: commercialProposals.status,
      preparedByName: commercialProposals.preparedByName,
    })
    .from(commercialProposals)
    .orderBy(desc(commercialProposals.createdAt));
  return rows;
}

export async function getProposal(id: string): Promise<Proposal | undefined> {
  const rows = await db
    .select()
    .from(commercialProposals)
    .where(eq(commercialProposals.id, id))
    .limit(1);
  const row = rows[0];
  if (!row) return undefined;

  const items = await db
    .select()
    .from(commercialProposalItems)
    .where(eq(commercialProposalItems.proposalId, id))
    .orderBy(
      asc(commercialProposalItems.sortOrder),
      asc(commercialProposalItems.createdAt)
    );

  return {
    id: row.id,
    number: row.number,
    proposalDate: row.proposalDate,
    customerId: row.customerId,
    clientName: row.clientName,
    clientPhone: row.clientPhone,
    clientCompany: row.clientCompany,
    clientAddress: row.clientAddress,
    projectName: row.projectName,
    language: row.language,
    currency: row.currency,
    themeColor: row.themeColor,
    preparedById: row.preparedById,
    preparedByName: row.preparedByName,
    preparedByPhone: row.preparedByPhone,
    deadline: row.deadline,
    brands: row.brands,
    subtotalMinor: row.subtotalMinor,
    totalMinor: row.totalMinor,
    finalText: row.finalText,
    validityNote: row.validityNote,
    status: row.status,
    sourceRequestId: row.sourceRequestId,
    items: items.map((item) => ({
      id: item.id,
      sortOrder: item.sortOrder,
      name: item.name,
      description: item.description,
      imageUrl: item.imageUrl,
      quantityMilli: item.quantityMilli,
      unit: item.unit,
      dimensions: item.dimensions,
      unitPriceMinor: item.unitPriceMinor,
      totalMinor: item.totalMinor,
    })),
  };
}

// The site already keeps a brand directory as the "brand_list" block editable
// under /admin/pages — reused here rather than standing up a second one.
export async function getBrandDirectory(): Promise<ProposalBrand[]> {
  const seen = new Map<string, ProposalBrand>();
  for (const slug of ["home", "about"]) {
    const page = await getPageBySlug(slug);
    for (const block of page?.blocks ?? []) {
      if (block.type !== "brand_list") continue;
      for (const item of block.items) {
        if (!item.name) continue;
        if (!seen.has(item.name)) {
          seen.set(item.name, { name: item.name, logoUrl: item.logoUrl });
        }
      }
    }
  }
  return [...seen.values()];
}

export async function getProposalCompanyInfo(): Promise<ProposalCompanyInfo> {
  const [contact, brand] = await Promise.all([
    getContactInfo(),
    getBrandAssets(),
  ]);
  return {
    name: brand.companyName,
    logoUrl: brand.primary,
    tagline: brand.companyTagline,
    phone: contact.phone,
    address: contact.address,
    instagram: contact.instagram,
    telegram: contact.telegram,
    website: "molly.uz",
  };
}

export async function getTextTemplates(
  options: { activeOnly?: boolean } = {}
): Promise<TextTemplate[]> {
  const rows = await db
    .select({
      id: proposalTextTemplates.id,
      name: proposalTextTemplates.name,
      language: proposalTextTemplates.language,
      text: proposalTextTemplates.text,
      active: proposalTextTemplates.active,
      authorName: adminUsers.name,
      createdAt: proposalTextTemplates.createdAt,
      updatedAt: proposalTextTemplates.updatedAt,
    })
    .from(proposalTextTemplates)
    .leftJoin(adminUsers, eq(proposalTextTemplates.createdById, adminUsers.id))
    .orderBy(asc(proposalTextTemplates.name));
  return options.activeOnly ? rows.filter((row) => row.active) : rows;
}

export async function getCustomerOptions(): Promise<ProposalCustomerOption[]> {
  return db
    .select({
      id: customersTable.id,
      name: customersTable.name,
      phone: customersTable.phone,
    })
    .from(customersTable)
    .orderBy(asc(customersTable.name));
}

export async function getProposalsForRequests(
  requestIds: string[]
): Promise<Map<string, ProposalSummary[]>> {
  const map = new Map<string, ProposalSummary[]>();
  if (requestIds.length === 0) return map;
  const rows = await db
    .select({
      id: commercialProposals.id,
      number: commercialProposals.number,
      proposalDate: commercialProposals.proposalDate,
      clientName: commercialProposals.clientName,
      projectName: commercialProposals.projectName,
      language: commercialProposals.language,
      currency: commercialProposals.currency,
      totalMinor: commercialProposals.totalMinor,
      status: commercialProposals.status,
      preparedByName: commercialProposals.preparedByName,
      sourceRequestId: commercialProposals.sourceRequestId,
    })
    .from(commercialProposals)
    .where(inArray(commercialProposals.sourceRequestId, requestIds));
  for (const { sourceRequestId, ...summary } of rows) {
    if (!sourceRequestId) continue;
    const list = map.get(sourceRequestId) ?? [];
    list.push(summary);
    map.set(sourceRequestId, list);
  }
  return map;
}
