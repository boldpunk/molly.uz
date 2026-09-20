"use server";

import { asc, eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  commercialProposals,
  commercialProposalItems,
  proposalTextTemplates,
  proposalCounters,
  customers as customersTable,
  requests as requestsTable,
  requestItems as requestItemsTable,
} from "@/db/schema";
import type { ProposalBrand } from "@/db/schema";
import { getCurrentAdmin } from "./admin-users";
import {
  lineTotalMinor,
  parseMoneyToMinor,
  parseQuantityToMilli,
  PROPOSAL_CURRENCIES,
  PROPOSAL_UNITS,
  type ProposalCurrency,
  type ProposalUnit,
} from "./proposal-money";
import { PROPOSAL_LANGUAGES, type ProposalLanguage } from "./proposal-i18n";
import { DEFAULT_THEME_COLOR, normalizeHex } from "./proposal-theme";
import { PROPOSAL_STATUSES, type ProposalStatus } from "./proposal-types";

// Proposal numbers run continuously rather than resetting per year, so a
// single counter row is incremented atomically — two managers pressing
// "create" at the same moment can't land on the same MH number.
async function nextProposalNumber(): Promise<string> {
  const [row] = await db
    .insert(proposalCounters)
    .values({ scope: "global", seq: 1 })
    .onConflictDoUpdate({
      target: proposalCounters.scope,
      set: { seq: sql`${proposalCounters.seq} + 1` },
    })
    .returning({ seq: proposalCounters.seq });
  return `MH-${String(row.seq).padStart(4, "0")}`;
}

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function pickLanguage(value: string): ProposalLanguage {
  return (PROPOSAL_LANGUAGES as string[]).includes(value)
    ? (value as ProposalLanguage)
    : "ru";
}

function pickCurrency(value: string): ProposalCurrency {
  return (PROPOSAL_CURRENCIES as string[]).includes(value)
    ? (value as ProposalCurrency)
    : "UZS";
}

function pickUnit(value: unknown): ProposalUnit {
  return typeof value === "string" && (PROPOSAL_UNITS as string[]).includes(value)
    ? (value as ProposalUnit)
    : "pcs";
}

function pickStatus(value: string): ProposalStatus {
  return (PROPOSAL_STATUSES as string[]).includes(value)
    ? (value as ProposalStatus)
    : "draft";
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function parseDate(value: string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : today();
}

interface IncomingItem {
  name?: unknown;
  description?: unknown;
  imageUrl?: unknown;
  quantity?: unknown;
  unit?: unknown;
  dimensions?: unknown;
  unitPrice?: unknown;
}

interface NormalizedItem {
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

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

// The editor posts raw strings and never a computed total: quantities, prices
// and every line sum are parsed and multiplied here, so the browser is not a
// source of truth for any number that ends up in front of a client (§15).
function normalizeItems(raw: FormDataEntryValue | null): NormalizedItem[] {
  if (typeof raw !== "string" || !raw) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];

  const items: NormalizedItem[] = [];
  for (const entry of parsed as IncomingItem[]) {
    const name = asString(entry.name);
    const imageUrl = asString(entry.imageUrl);
    const quantityMilli = parseQuantityToMilli(asString(entry.quantity)) ?? 0;
    const unitPriceMinor = parseMoneyToMinor(asString(entry.unitPrice)) ?? 0;
    const safeQuantity = quantityMilli > 0 ? quantityMilli : 1000;
    const safePrice = unitPriceMinor >= 0 ? unitPriceMinor : 0;
    if (!name && !imageUrl && safePrice === 0) continue;
    items.push({
      sortOrder: items.length,
      name,
      description: asString(entry.description),
      imageUrl: imageUrl || null,
      quantityMilli: safeQuantity,
      unit: pickUnit(entry.unit),
      dimensions: asString(entry.dimensions),
      unitPriceMinor: safePrice,
      totalMinor: lineTotalMinor(safeQuantity, safePrice),
    });
  }
  return items;
}

function parseBrands(raw: FormDataEntryValue | null): ProposalBrand[] {
  if (typeof raw !== "string" || !raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((entry) => ({
        name: asString((entry as ProposalBrand).name),
        logoUrl: asString((entry as ProposalBrand).logoUrl) || undefined,
      }))
      .filter((brand) => brand.name);
  } catch {
    return [];
  }
}

export async function createProposal() {
  const admin = await getCurrentAdmin();
  const number = await nextProposalNumber();
  const [row] = await db
    .insert(commercialProposals)
    .values({
      number,
      proposalDate: today(),
      preparedById: admin?.id,
      preparedByName: admin?.name ?? "",
      createdById: admin?.id,
    })
    .returning({ id: commercialProposals.id });

  revalidatePath("/admin/proposals");
  redirect(`/admin/proposals/${row.id}`);
}

export async function saveProposal(id: string, formData: FormData) {
  const items = normalizeItems(formData.get("itemsJson"));
  const subtotalMinor = items.reduce((sum, item) => sum + item.totalMinor, 0);
  const customerId = text(formData, "customerId");

  await db
    .update(commercialProposals)
    .set({
      proposalDate: parseDate(text(formData, "proposalDate")),
      customerId: customerId || null,
      clientName: text(formData, "clientName"),
      clientPhone: text(formData, "clientPhone"),
      clientCompany: text(formData, "clientCompany"),
      clientAddress: text(formData, "clientAddress"),
      projectName: text(formData, "projectName"),
      language: pickLanguage(text(formData, "language")),
      currency: pickCurrency(text(formData, "currency")),
      themeColor: normalizeHex(text(formData, "themeColor") || DEFAULT_THEME_COLOR),
      preparedByName: text(formData, "preparedByName"),
      preparedByPhone: text(formData, "preparedByPhone"),
      deadline: text(formData, "deadline"),
      brands: parseBrands(formData.get("brandsJson")),
      finalText: text(formData, "finalText"),
      validityNote: text(formData, "validityNote"),
      status: pickStatus(text(formData, "status")),
      subtotalMinor,
      totalMinor: subtotalMinor,
      updatedAt: new Date(),
    })
    .where(eq(commercialProposals.id, id));

  // Items are replaced wholesale: the editor owns the whole list including its
  // order, and rewriting it keeps sort_order gap-free without diffing.
  await db
    .delete(commercialProposalItems)
    .where(eq(commercialProposalItems.proposalId, id));
  if (items.length > 0) {
    await db
      .insert(commercialProposalItems)
      .values(items.map((item) => ({ ...item, proposalId: id })));
  }

  revalidatePath("/admin/proposals");
  revalidatePath(`/admin/proposals/${id}`);
  revalidatePath(`/admin/proposals/${id}/preview`);
}

export async function setProposalStatus(id: string, status: string) {
  await db
    .update(commercialProposals)
    .set({ status: pickStatus(status), updatedAt: new Date() })
    .where(eq(commercialProposals.id, id));
  revalidatePath("/admin/proposals");
  revalidatePath(`/admin/proposals/${id}`);
}

export async function deleteProposal(id: string) {
  await db.delete(commercialProposals).where(eq(commercialProposals.id, id));
  revalidatePath("/admin/proposals");
  redirect("/admin/proposals");
}

export async function duplicateProposal(id: string) {
  const [source] = await db
    .select()
    .from(commercialProposals)
    .where(eq(commercialProposals.id, id))
    .limit(1);
  if (!source) redirect("/admin/proposals");

  const admin = await getCurrentAdmin();
  const number = await nextProposalNumber();
  const [copy] = await db
    .insert(commercialProposals)
    .values({
      number,
      proposalDate: today(),
      customerId: source.customerId,
      clientName: source.clientName,
      clientPhone: source.clientPhone,
      clientCompany: source.clientCompany,
      clientAddress: source.clientAddress,
      projectName: source.projectName,
      language: source.language,
      currency: source.currency,
      themeColor: source.themeColor,
      preparedById: source.preparedById,
      preparedByName: source.preparedByName,
      preparedByPhone: source.preparedByPhone,
      deadline: source.deadline,
      brands: source.brands,
      subtotalMinor: source.subtotalMinor,
      totalMinor: source.totalMinor,
      finalText: source.finalText,
      validityNote: source.validityNote,
      status: "draft",
      createdById: admin?.id,
    })
    .returning({ id: commercialProposals.id });

  const items = await db
    .select()
    .from(commercialProposalItems)
    .where(eq(commercialProposalItems.proposalId, id))
    .orderBy(asc(commercialProposalItems.sortOrder));
  if (items.length > 0) {
    await db.insert(commercialProposalItems).values(
      items.map((item) => ({
        proposalId: copy.id,
        sortOrder: item.sortOrder,
        name: item.name,
        description: item.description,
        imageUrl: item.imageUrl,
        quantityMilli: item.quantityMilli,
        unit: item.unit,
        dimensions: item.dimensions,
        unitPriceMinor: item.unitPriceMinor,
        totalMinor: item.totalMinor,
      }))
    );
  }

  revalidatePath("/admin/proposals");
  redirect(`/admin/proposals/${copy.id}`);
}

// §35: the proposal takes a copy of the lead and then lives its own life —
// nothing here links prices back, so editing either side leaves the other
// untouched. sourceRequestId is kept only to show the link in the UI.
export async function createProposalFromRequest(requestId: string) {
  const [request] = await db
    .select()
    .from(requestsTable)
    .where(eq(requestsTable.id, requestId))
    .limit(1);
  if (!request) redirect("/admin/requests");

  const admin = await getCurrentAdmin();
  const number = await nextProposalNumber();

  let customerId = request.customerId;
  if (!customerId && request.customerPhone) {
    const [matching] = await db
      .select({ id: customersTable.id })
      .from(customersTable)
      .where(eq(customersTable.phone, request.customerPhone))
      .limit(1);
    customerId = matching?.id ?? null;
  }

  const [proposal] = await db
    .insert(commercialProposals)
    .values({
      number,
      proposalDate: today(),
      customerId,
      clientName: request.customerName,
      clientPhone: request.customerPhone,
      projectName: request.orderNumber ? `Заказ ${request.orderNumber}` : "",
      preparedById: admin?.id,
      preparedByName: admin?.name ?? "",
      createdById: admin?.id,
      sourceRequestId: request.id,
    })
    .returning({ id: commercialProposals.id });

  const sourceItems = await db
    .select()
    .from(requestItemsTable)
    .where(eq(requestItemsTable.requestId, requestId));

  if (sourceItems.length > 0) {
    const values = sourceItems.map((item, index) => {
      const description = [
        item.hardwareLabel ? `Фурнитура: ${item.hardwareLabel}` : "",
        item.colourLabel ? `Цвет: ${item.colourLabel}` : "",
      ]
        .filter(Boolean)
        .join("\n");
      const estimateMinor = item.estimate ? item.estimate * 100 : 0;
      const quantityMilli = item.widthMetres
        ? Math.round(item.widthMetres * 1000)
        : 1000;
      // The lead stores an estimate for the whole line, not a unit price;
      // dividing it back out keeps quantity × price consistent in the proposal.
      const unitPriceMinor = Math.round((estimateMinor * 1000) / quantityMilli);
      return {
        proposalId: proposal.id,
        sortOrder: index,
        name: item.productName,
        description,
        quantityMilli,
        unit: (item.widthMetres ? "rm" : "pcs") as ProposalUnit,
        dimensions: item.widthMetres ? `${item.widthMetres} м` : "",
        unitPriceMinor,
        totalMinor: lineTotalMinor(quantityMilli, unitPriceMinor),
      };
    });

    await db.insert(commercialProposalItems).values(values);

    const subtotalMinor = values.reduce((sum, item) => sum + item.totalMinor, 0);
    await db
      .update(commercialProposals)
      .set({ subtotalMinor, totalMinor: subtotalMinor })
      .where(eq(commercialProposals.id, proposal.id));
  }

  revalidatePath("/admin/proposals");
  redirect(`/admin/proposals/${proposal.id}`);
}

// --- Text templates ------------------------------------------------------

export async function createTextTemplate(formData: FormData) {
  const admin = await getCurrentAdmin();
  const name = text(formData, "name");
  const body = text(formData, "text");
  if (!name || !body) {
    revalidatePath("/admin/proposals/templates");
    return;
  }
  await db.insert(proposalTextTemplates).values({
    name,
    text: body,
    language: pickLanguage(text(formData, "language")),
    active: formData.get("active") !== null,
    createdById: admin?.id,
  });
  revalidatePath("/admin/proposals/templates");
}

export async function updateTextTemplate(id: string, formData: FormData) {
  await db
    .update(proposalTextTemplates)
    .set({
      name: text(formData, "name"),
      text: text(formData, "text"),
      language: pickLanguage(text(formData, "language")),
      active: formData.get("active") !== null,
      updatedAt: new Date(),
    })
    .where(eq(proposalTextTemplates.id, id));
  revalidatePath("/admin/proposals/templates");
}

export async function deleteTextTemplate(id: string) {
  await db
    .delete(proposalTextTemplates)
    .where(eq(proposalTextTemplates.id, id));
  revalidatePath("/admin/proposals/templates");
}
