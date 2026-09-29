import Link from "next/link";
import { getPageBySlug, getContactInfo } from "@/lib/data";
import { pageMetadata } from "@/lib/seo";
import { PageHero } from "@/components/page-hero";
import type { PageBlock } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const page = await getPageBySlug("contacts");
  return pageMetadata(
    page,
    "Контакты — Molly Home",
    "Телефон, адрес и мессенджеры Molly Home в Ташкенте.",
    undefined,
    "/contacts"
  );
}

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
  const contact = await getContactInfo();
  const telHref = `tel:${contact.phone.replace(/[^+\d]/g, "")}`;

  const cards = [
    {
      label: "Телефон",
      value: contact.phone,
      note: contact.hours,
      href: telHref,
      tone: "bg-clay-light text-clay",
      icon: "M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1l-2.3 2.2Z",
    },
    contact.telegram && {
      label: "Telegram",
      value: `@${contact.telegram}`,
      note: "Ответим прямо в чате",
      href: `https://t.me/${contact.telegram}`,
      external: true,
      tone: "bg-[#e3f4fd] text-[#2aabee]",
      icon: "M21.5 4.3 2.9 11.5c-1.3.5-1.3 1.2-.2 1.6l4.8 1.5 1.8 5.6c.2.6.1.9.8.9.5 0 .7-.2 1-.5l2.3-2.3 4.9 3.6c.9.5 1.5.2 1.8-.8l3.2-15.2c.3-1.3-.5-1.9-1.8-1.4Z",
    },
    contact.instagram && {
      label: "Instagram",
      value: `@${contact.instagram}`,
      note: "Новинки и проекты",
      href: `https://www.instagram.com/${contact.instagram}`,
      external: true,
      tone: "bg-sage-light text-sage",
      icon: "M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Zm5 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm5.5-1.5h.01",
    },
    contact.email && {
      label: "Почта",
      value: contact.email,
      note: "Для документов и КП",
      href: `mailto:${contact.email}`,
      tone: "bg-cream text-accent-dark",
      icon: "M4 6h16v12H4V6Zm0 0 8 7 8-7",
    },
  ].filter(Boolean) as {
    label: string;
    value: string;
    note?: string;
    href: string;
    external?: boolean;
    tone: string;
    icon: string;
  }[];

  return (
    <>
      <PageHero eyebrow="На связи" title={heading} text={subtitle}>
        <div className="flex flex-wrap gap-3">
          <a href={telHref} className="btn btn-primary">
            Позвонить
          </a>
          <Link href="/request" className="btn btn-outline">
            Заявка на замер
          </Link>
        </div>
      </PageHero>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((c) => (
            <a
              key={c.label}
              href={c.href}
              target={c.external ? "_blank" : undefined}
              rel={c.external ? "noreferrer" : undefined}
              className="group flex flex-col gap-4 rounded-3xl border border-navy/10 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-transparent hover:shadow-2xl hover:shadow-navy/10"
            >
              <span className={`flex h-12 w-12 items-center justify-center rounded-2xl transition duration-300 group-hover:scale-110 ${c.tone}`}>
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
                  <path d={c.icon} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span>
                <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-navy/40">{c.label}</span>
                <span className="mt-1 block break-words font-heading text-lg font-bold text-navy">{c.value}</span>
                {c.note && <span className="mt-1 block text-xs text-navy/55">{c.note}</span>}
              </span>
            </a>
          ))}
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_2fr]">
          <div className="flex flex-col justify-between gap-6 rounded-3xl bg-navy p-7 text-white">
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-cream/60">Адрес</span>
              <p className="mt-3 font-heading text-xl font-bold leading-snug">{contact.address}</p>
              {contact.addressNote && <p className="mt-2 text-sm text-white/60">{contact.addressNote}</p>}
            </div>
            <a
              href={`https://yandex.uz/maps/?pt=${contact.mapLng},${contact.mapLat}&z=16&l=map`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-light w-fit"
            >
              Построить маршрут
            </a>
          </div>
          <div className="overflow-hidden rounded-3xl border border-navy/10">
            <iframe
              title="Molly Home на карте"
              src={mapSrc(contact.mapLat, contact.mapLng)}
              className="h-full min-h-[380px] w-full"
              loading="lazy"
            />
          </div>
        </div>
      </section>
    </>
  );
}
