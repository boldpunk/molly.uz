import { cookies } from "next/headers";
import { eq, and, desc, count } from "drizzle-orm";
import { db } from "@/db";
import { customers, requests, requestItems } from "@/db/schema";
import type { StatusHistoryEntry } from "@/db/schema";
import {
  CUSTOMER_SESSION_COOKIE,
  verifyCustomerSessionToken,
} from "./customer-session";

export function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, "");
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
}

export async function getCurrentCustomer(): Promise<Customer | null> {
  const store = await cookies();
  const token = store.get(CUSTOMER_SESSION_COOKIE.name)?.value;
  const customerId = await verifyCustomerSessionToken(token);
  if (!customerId) return null;

  const rows = await db
    .select({ id: customers.id, name: customers.name, phone: customers.phone })
    .from(customers)
    .where(eq(customers.id, customerId))
    .limit(1);

  return rows[0] ?? null;
}

export async function getCustomerByPhone(phone: string) {
  const rows = await db
    .select()
    .from(customers)
    .where(eq(customers.phone, phone))
    .limit(1);
  return rows[0];
}

export interface CustomerRequestSummary {
  id: string;
  status: string;
  notes: string;
  createdAt: Date;
  itemCount: number;
}

export async function getCustomerRequests(
  customerId: string
): Promise<CustomerRequestSummary[]> {
  const rows = await db
    .select({
      id: requests.id,
      status: requests.status,
      notes: requests.notes,
      createdAt: requests.createdAt,
      itemCount: count(requestItems.id),
    })
    .from(requests)
    .leftJoin(requestItems, eq(requestItems.requestId, requests.id))
    .where(eq(requests.customerId, customerId))
    .groupBy(requests.id)
    .orderBy(desc(requests.createdAt));

  return rows;
}

export interface CustomerRequestDetail {
  id: string;
  status: string;
  statusHistory: StatusHistoryEntry[];
  orderNumber: string | null;
  notes: string;
  createdAt: Date;
  totalAmount: number | null;
  depositAmount: number | null;
  paidAmount: number | null;
  items: {
    id: string;
    productName: string;
    categorySlug: string;
    productSlug: string;
    hardwareLabel: string | null;
    colourLabel: string | null;
    widthMetres: number | null;
    estimate: number | null;
  }[];
}

export async function getCustomerRequestDetail(
  customerId: string,
  requestId: string
): Promise<CustomerRequestDetail | null> {
  const rows = await db
    .select()
    .from(requests)
    .where(and(eq(requests.id, requestId), eq(requests.customerId, customerId)))
    .limit(1);
  const request = rows[0];
  if (!request) return null;

  const items = await db
    .select({
      id: requestItems.id,
      productName: requestItems.productName,
      categorySlug: requestItems.categorySlug,
      productSlug: requestItems.productSlug,
      hardwareLabel: requestItems.hardwareLabel,
      colourLabel: requestItems.colourLabel,
      widthMetres: requestItems.widthMetres,
      estimate: requestItems.estimate,
    })
    .from(requestItems)
    .where(eq(requestItems.requestId, requestId));

  return {
    id: request.id,
    status: request.status,
    statusHistory: request.statusHistory,
    orderNumber: request.orderNumber,
    notes: request.notes,
    createdAt: request.createdAt,
    totalAmount: request.totalAmount,
    depositAmount: request.depositAmount,
    paidAmount: request.paidAmount,
    items,
  };
}
