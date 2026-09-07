export const metadata = { title: "Доставка и оплата — Molly Home" };

export default function DeliveryPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-14">
      <h1 className="font-heading text-3xl font-bold text-navy">
        Доставка и оплата
      </h1>
      <p className="mt-6 text-sm leading-relaxed text-navy/70">
        Сроки доставки, гарантийные условия и варианты рассрочки — это
        бизнес-решения, которые уточняются менеджером индивидуально по
        каждому заказу. Точные условия появятся здесь после согласования с
        командой Molly Home.
      </p>
      <p className="mt-4 text-sm leading-relaxed text-navy/70">
        Способы оплаты (в т.ч. Payme, Click, Uzcard или наличный расчёт)
        уточняются на этапе подтверждения заказа.
      </p>
    </div>
  );
}
