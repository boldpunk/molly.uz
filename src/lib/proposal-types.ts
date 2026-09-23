import type { ProposalBrand } from "@/db/schema";
import type { ProposalCurrency, ProposalUnit } from "./proposal-money";
import type { ProposalLanguage } from "./proposal-i18n";

// Pure types and constants shared by server queries and client components.
// Kept out of proposals.ts so importing a status label into a "use client"
// file can't drag the database driver into the browser bundle.

export type ProposalStatus =
  | "draft"
  | "ready"
  | "sent"
  | "accepted"
  | "rejected"
  | "archived";

export const PROPOSAL_STATUSES: ProposalStatus[] = [
  "draft",
  "ready",
  "sent",
  "accepted",
  "rejected",
  "archived",
];

export const PROPOSAL_STATUS_LABELS: Record<ProposalStatus, string> = {
  draft: "Черновик",
  ready: "Готово",
  sent: "Отправлено",
  accepted: "Принято",
  rejected: "Отклонено",
  archived: "Архив",
};

export interface ProposalItem {
  id: string;
  sortOrder: number;
  name: string;
  description: string;
  imageUrl: string | null;
  quantityMilli: number;
  unit: ProposalUnit;
  dimensions: string;
  unitPriceMinor: number;
  totalMinor: number;
}

export interface ProposalSummary {
  id: string;
  number: string;
  proposalDate: string;
  clientName: string;
  projectName: string;
  language: ProposalLanguage;
  currency: ProposalCurrency;
  totalMinor: number;
  status: ProposalStatus;
  preparedByName: string;
}

export interface Proposal extends ProposalSummary {
  customerId: string | null;
  clientPhone: string;
  clientCompany: string;
  clientAddress: string;
  themeColor: string;
  preparedById: string | null;
  preparedByPhone: string;
  deadline: string;
  brands: ProposalBrand[];
  subtotalMinor: number;
  finalText: string;
  validityNote: string;
  sourceRequestId: string | null;
  items: ProposalItem[];
}

export interface ProposalCompanyInfo {
  name: string;
  /** Administrator-uploaded logo; null uses the built-in wordmark. */
  logoUrl: string | null;
  tagline: string;
  phone: string;
  address: string;
  instagram: string;
  telegram: string;
  website: string;
}

export interface TextTemplate {
  id: string;
  name: string;
  language: ProposalLanguage;
  text: string;
  active: boolean;
  authorName: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProposalCustomerOption {
  id: string;
  name: string;
  phone: string;
}
