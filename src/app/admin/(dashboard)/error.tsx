"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin page failed", error);
  }, [error]);

  return (
    <div className="rounded-xl border border-navy/10 bg-white p-10 text-center">
      <h1 className="font-heading text-xl font-bold text-navy">
        Раздел не загрузился
      </h1>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-navy/60">
        Не удалось получить данные. Обычно помогает повторная попытка — данные
        при этом не теряются.
      </p>
      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy/90"
        >
          Повторить
        </button>
        <Link
          href="/admin"
          className="rounded-full border border-navy/15 px-5 py-2.5 text-sm font-medium text-navy transition hover:bg-navy/5"
        >
          На дашборд
        </Link>
      </div>
      {error.digest && (
        <p className="mt-7 font-mono text-[11px] text-navy/30">
          Код ошибки: {error.digest}
        </p>
      )}
    </div>
  );
}
