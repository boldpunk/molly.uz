import Link from "next/link";
import { getCategories, searchProducts } from "@/lib/data";
import { ProductCard } from "@/components/product-card";
import { PageHero } from "@/components/page-hero";

export const metadata = {
  title: "Поиск — Molly Home",
  robots: { index: false, follow: true },
};
export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim();
  const [results, categories] = await Promise.all([
    query ? searchProducts(query) : Promise.resolve([]),
    getCategories(),
  ]);

  return (
    <>
    <PageHero title="Поиск" text="Найдите модель по названию, коллекции или типу мебели.">
      <form action="/search" method="GET" className="max-w-xl">
        <label className="flex items-center gap-3 rounded-full border border-navy/15 bg-white py-2 pl-5 pr-2 shadow-lg shadow-navy/5 transition focus-within:border-navy/40">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="shrink-0 text-navy/40">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="M21 21l-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            name="q"
            defaultValue={query}
            autoFocus
            placeholder="Название модели, коллекция, тип мебели…"
            className="w-full bg-transparent py-2 text-base text-navy outline-none placeholder:text-navy/40"
          />
          <button type="submit" className="btn btn-primary shrink-0 px-5 py-2.5">
            Найти
          </button>
        </label>
      </form>
    </PageHero>
    <div className="mx-auto max-w-7xl px-6 pb-16 pt-8">

      {query && (
        <p className="text-sm text-navy/50">
          {results.length === 0
            ? `Ничего не найдено по запросу «${query}»`
            : `${results.length} ${resultsWord(results.length)} по запросу «${query}»`}
        </p>
      )}

      {results.length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
          {results.map((p, i) => (
            <div key={p.id} className="h-full animate-fade-up" style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}>
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      )}

      {results.length === 0 && (
        <div className="mt-4">
          <p className="text-sm text-navy/55">
            {query ? "Попробуйте другой запрос или загляните в разделы каталога:" : "Или выберите раздел каталога:"}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/catalog/${c.slug}`}
                className="rounded-full bg-white px-4 py-2 text-sm font-medium text-navy ring-1 ring-navy/15 transition hover:bg-navy hover:text-white"
              >
                {c.name}
              </Link>
            ))}
            <Link href="/catalog" className="rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white">
              Весь каталог
            </Link>
          </div>
        </div>
      )}
    </div>
    </>
  );
}

function resultsWord(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "товар найден";
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) {
    return "товара найдено";
  }
  return "товаров найдено";
}
