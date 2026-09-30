import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { requests, requestItems } from "@/db/schema";
import { getCurrentAdmin } from "@/lib/admin-users";
import { REQUEST_STATUS_LABELS, type RequestStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

// A spreadsheet of every request for reporting outside the admin. Semicolons
// and a byte-order mark so Excel with a Russian locale opens it correctly
// without an import wizard.
function cell(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin || !["administrator", "sales_manager"].includes(admin.role)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const [rows, items] = await Promise.all([
    db.select().from(requests).orderBy(desc(requests.createdAt)),
    db.select().from(requestItems),
  ]);
  const byRequest = new Map<string, typeof items>();
  for (const item of items) {
    const list = byRequest.get(item.requestId) ?? [];
    list.push(item);
    byRequest.set(item.requestId, list);
  }

  const header = ["Номер", "Дата", "Клиент", "Телефон", "Источник", "Статус", "Товары", "Оценка, сум", "Залог, сум", "Оплачено, сум", "Заметки"];
  const lines = rows.map((r) => {
    const list = byRequest.get(r.id) ?? [];
    const estimate = list.reduce((sum, i) => sum + (i.estimate ?? 0), 0);
    return [
      r.orderNumber,
      r.createdAt.toLocaleString("ru-RU", { timeZone: "Asia/Tashkent" }),
      r.customerName,
      r.customerPhone,
      r.source,
      REQUEST_STATUS_LABELS[r.status as RequestStatus]?.replace(/^\S+\s/, ""),
      list.map((i) => i.productName).join(", "),
      estimate || "",
      r.depositAmount ?? "",
      r.paidAmount ?? "",
      r.notes,
    ]
      .map(cell)
      .join(";");
  });

  const csv = "﻿" + [header.join(";"), ...lines].join("\r\n");
  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="molly-zayavki-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
