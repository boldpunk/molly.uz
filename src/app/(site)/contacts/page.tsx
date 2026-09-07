import Link from "next/link";

export const metadata = { title: "Контакты — Molly Home" };

const MAP_SRC =
  "https://www.openstreetmap.org/export/embed.html?bbox=69.15%2C41.22%2C69.35%2C41.36&layer=mapnik&marker=41.2995%2C69.2401";

export default function ContactsPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-14">
      <h1 className="font-heading text-3xl font-bold text-navy">Контакты</h1>
      <p className="mt-2 text-sm text-navy/60">
        Свяжитесь с нами удобным способом или оставьте заявку — мы перезвоним
        и согласуем замер.
      </p>

      <div className="mt-8 grid gap-8 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-navy/10 bg-white p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-navy/40">
              Телефон
            </h2>
            <a
              href="tel:+998000000000"
              className="mt-2 block font-heading text-xl font-bold text-navy hover:underline"
            >
              +998 00 000 00 00
            </a>
            <p className="mt-1 text-xs text-navy/50">
              Пн–Сб: 09:00–19:00 · Вс: выходной
            </p>
          </div>

          <div className="rounded-xl border border-navy/10 bg-white p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-navy/40">
              Мессенджеры
            </h2>
            <div className="mt-2 flex flex-col gap-2 text-sm">
              <a
                href="https://t.me/mollyhome"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 font-medium text-sage-dark hover:underline"
              >
                Telegram — @mollyhome
              </a>
              <a
                href="https://instagram.com/mollyhome"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 font-medium text-navy hover:underline"
              >
                Instagram — @mollyhome
              </a>
            </div>
          </div>

          <div className="rounded-xl border border-navy/10 bg-white p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-navy/40">
              Адрес
            </h2>
            <p className="mt-2 text-sm text-navy/70">
              Ташкент, Узбекистан
            </p>
            <p className="mt-1 text-xs text-navy/50">
              Работаем по всему Ташкенту и области — выезд замерщика
              бесплатный.
            </p>
          </div>

          <Link
            href="/request"
            className="rounded-xl border border-navy/10 bg-navy p-5 text-white transition hover:bg-navy/90"
          >
            <h2 className="text-sm font-semibold uppercase tracking-wide text-white/60">
              Заявка на замер
            </h2>
            <p className="mt-2 flex items-center gap-1.5 font-heading text-lg font-bold">
              Оставить заявку
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 12h14m0 0-6-6m6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </p>
          </Link>
        </div>

        <div className="overflow-hidden rounded-xl border border-navy/10">
          <iframe
            title="Molly Home на карте"
            src={MAP_SRC}
            className="h-full min-h-[420px] w-full"
            loading="lazy"
          />
        </div>
      </div>
    </div>
  );
}
