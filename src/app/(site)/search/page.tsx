import Link from "next/link";
import { searchProducts } from "@/lib/data";
import { ProductCard } from "@/components/product-card";

export const metadata = { title: "Поиск — Molly Home" };
export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim();
  const results = query ? await searchProducts(query) : [];

  return (
    <div className="mx-auto max-w-6xl px-6 py-14">
      <h1 className="font-heading text-2xl font-bold text-navy">Поиск</h1>
      <form action="/search" method="GET" className="mt-6 max-w-lg">
        <label className="flex items-center gap-2 rounded-full border border-navy/15 bg-white px-4 py-2.5 focus-within:border-navy/40">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0 text-navy/40">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="M21 21l-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            name="q"
            defaultValue={query}
            autoFocus
            placeholder="Название модели, коллекция, тип мебели…"
            className="w-full bg-transparent text-sm text-navy outline-none placeholder:text-navy/40"
          />
        </label>
      </form>

      {query && (
        <p className="mt-6 text-sm text-navy/50">
          {results.length === 0
            ? `Ничего не найдено по запросу «${query}»`
            : `${results.length} ${resultsWord(results.length)} по запросу «${query}»`}
        </p>
      )}

      {results.length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {results.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

      {query && results.length === 0 && (
        <p className="mt-2 text-sm text-navy/40">
          Попробуйте другой запрос или посмотрите{" "}
          <Link href="/catalog/kuhonnaya-mebel" className="text-navy underline">
            весь каталог
          </Link>
          .
        </p>
      )}
    </div>
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
