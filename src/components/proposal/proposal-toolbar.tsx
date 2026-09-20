"use client";

import Link from "next/link";

export function ProposalToolbar({
  editHref,
  number,
}: {
  editHref: string;
  number: string;
}) {
  return (
    <div className="kp-toolbar sticky top-0 z-20 mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-navy/10 bg-white/95 px-4 py-3 backdrop-blur">
      <div className="flex items-center gap-3">
        <Link
          href={editHref}
          className="rounded-full border border-navy/15 px-4 py-2 text-sm font-medium text-navy/70 transition hover:bg-navy/5"
        >
          ← Редактировать
        </Link>
        <span className="font-mono text-sm font-semibold text-navy">
          {number}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="hidden text-xs text-navy/40 sm:inline">
          В окне печати выберите «Сохранить как PDF»
        </span>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-full border border-navy/15 px-4 py-2 text-sm font-medium text-navy transition hover:bg-navy/5"
        >
          Печать
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-full bg-navy px-5 py-2 text-sm font-semibold text-white transition hover:bg-navy/90"
        >
          Скачать PDF
        </button>
      </div>
    </div>
  );
}
