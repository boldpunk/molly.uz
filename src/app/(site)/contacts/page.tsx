export const metadata = { title: "Контакты — Molly Home" };

export default function ContactsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-14">
      <h1 className="font-heading text-3xl font-bold text-navy">Контакты</h1>
      <div className="mt-6 flex flex-col gap-3 text-sm text-navy/70">
        <p>Ташкент, Узбекистан</p>
        <a href="tel:+998000000000" className="hover:underline">
          +998 00 000 00 00
        </a>
        <a
          href="https://t.me/mollyhome"
          target="_blank"
          rel="noreferrer"
          className="hover:underline"
        >
          Telegram: @mollyhome
        </a>
        <a
          href="https://instagram.com/mollyhome"
          target="_blank"
          rel="noreferrer"
          className="hover:underline"
        >
          Instagram: @mollyhome
        </a>
      </div>
    </div>
  );
}
