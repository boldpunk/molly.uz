export default function AdminLoading() {
  return (
    <div aria-busy="true">
      <span className="sr-only">Загружаем…</span>
      <div className="h-7 w-56 animate-pulse rounded-md bg-navy/[0.07]" />
      <div className="mt-2 h-4 w-80 animate-pulse rounded-md bg-navy/[0.05]" />
      <div className="mt-6 overflow-hidden rounded-xl border border-navy/10 bg-white">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b border-navy/5 px-4 py-4 last:border-0"
          >
            <div className="h-4 w-24 animate-pulse rounded bg-navy/[0.07]" />
            <div className="h-4 flex-1 animate-pulse rounded bg-navy/[0.05]" />
            <div className="h-4 w-20 animate-pulse rounded bg-navy/[0.05]" />
          </div>
        ))}
      </div>
    </div>
  );
}
