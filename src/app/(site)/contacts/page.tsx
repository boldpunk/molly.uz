import Link from "next/link";
import { getPageBySlug } from "@/lib/data";
import type { PageBlock } from "@/db/schema";

export const dynamic = "force-dynamic";
export const metadata = { title: "Контакты — Molly Home" };

function pick<T extends PageBlock["type"]>(
  blocks: PageBlock[],
  index: number,
  type: T
): Extract<PageBlock, { type: T }> | undefined {
  const b = blocks[index];
  return b && b.type === type ? (b as Extract<PageBlock, { type: T }>) : undefined;
}

function mapSrc(lat: number, lng: number) {
  const dLat = 0.07;
  const dLng = 0.1;
  const bbox = [lng - dLng, lat - dLat, lng + dLng, lat + dLat].join("%2C");
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;
}

export default async function ContactsPage() {
  const page = await getPageBySlug("contacts");
  const blocks = page?.blocks ?? [];

  const heading = pick(blocks, 0, "heading")?.text ?? "Контакты";
  const subtitle =
    pick(blocks, 1, "paragraph")?.text ??
    "Свяжитесь с нами удобным способом или оставьте заявку — мы перезвоним и согласуем замер.";
  const contact = pick(blocks, 2, "contact_info") ?? {
    type: "contact_info" as const,
    phone: "+998 00 000 00 00",
    hours: "Пн–Сб: 09:00–19:00 · Вс: выходной",
    telegram: "mollyhome",
    instagram: "mollyhome",
    address: "Ташкент, Узбекистан",
    addressNote:
      "Работаем по всему Ташкенту и области — выезд замерщика бесплатный.",
    mapLat: 41.2995,
    mapLng: 69.2401,
  };
  const telHref = `tel:${contact.phone.replace(/[^+\d]/g, "")}`;

  return (
    <div className="mx-auto max-w-5xl px-6 py-14">
      <h1 className="font-heading text-3xl font-bold text-navy">{heading}</h1>
      <p className="mt-2 text-sm text-navy/60">{subtitle}</p>

      <div className="mt-8 grid gap-8 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-navy/10 bg-white p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-navy/40">
              Телефон
            </h2>
            <a
              href={telHref}
              className="mt-2 block font-heading text-xl font-bold text-navy hover:underline"
            >
              {contact.phone}
            </a>
            <p className="mt-1 text-xs text-navy/50">{contact.hours}</p>
          </div>

          <div className="rounded-xl border border-navy/10 bg-white p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-navy/40">
              Мессенджеры
            </h2>
            <div className="mt-2 flex flex-col gap-2 text-sm">
              {contact.telegram && (
                <a
                  href={`https://t.me/${contact.telegram}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 font-medium text-sage-dark hover:underline"
                >
                  Telegram — @{contact.telegram}
                </a>
              )}
              {contact.instagram && (
                <a
                  href={`https://instagram.com/${contact.instagram}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 font-medium text-navy hover:underline"
                >
                  Instagram — @{contact.instagram}
                </a>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-navy/10 bg-white p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-navy/40">
              Адрес
            </h2>
            <p className="mt-2 text-sm text-navy/70">{contact.address}</p>
            <p className="mt-1 text-xs text-navy/50">{contact.addressNote}</p>
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
            src={mapSrc(contact.mapLat, contact.mapLng)}
            className="h-full min-h-[420px] w-full"
            loading="lazy"
          />
        </div>
      </div>
    </div>
  );
}
