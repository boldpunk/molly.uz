// Every storefront page is force-dynamic and waits on the database, so this
// stands in during navigation instead of the page appearing to freeze.
export default function SiteLoading() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-16" aria-busy="true">
      <span className="sr-only">Загружаем…</span>
      <div className="h-7 w-2/5 animate-pulse rounded-md bg-navy/[0.07]" />
      <div className="mt-3 h-4 w-3/5 animate-pulse rounded-md bg-navy/[0.05]" />
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-xl">
            <div className="aspect-[4/3] w-full animate-pulse bg-navy/[0.06]" />
            <div className="mt-3 h-4 w-3/4 animate-pulse rounded-md bg-navy/[0.06]" />
            <div className="mt-2 h-3 w-1/2 animate-pulse rounded-md bg-navy/[0.04]" />
          </div>
        ))}
      </div>
    </div>
  );
}
