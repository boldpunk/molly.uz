import { SITE_URL } from "@/lib/site";

export const metadata = {
  title: "Условия использования — Molly Home",
  alternates: { canonical: `${SITE_URL}/terms` },
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <h2 className="font-heading text-lg font-bold text-navy">{title}</h2>
      <div className="mt-2 flex flex-col gap-2 text-sm leading-relaxed text-navy/70">
        {children}
      </div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-14">
      <h1 className="font-heading text-3xl font-bold text-navy">
        Условия использования сайта
      </h1>
      <p className="mt-3 text-sm text-navy/50">Действует с 2026 года</p>

      <Section title="1. Общие положения">
        <p>
          Эта страница описывает условия использования сайта molly.uz.
          Используя сайт и отправляя заявки через него, вы соглашаетесь с
          изложенными ниже условиями.
        </p>
      </Section>

      <Section title="2. Заявка на замер — это не заказ">
        <p>
          Отправка заявки на замер не создаёт обязательства купить товар.
          Это запрос на консультацию: наш менеджер свяжется с вами, уточнит
          детали и организует бесплатный выезд замерщика. Финальные условия
          заказа согласовываются отдельно.
        </p>
      </Section>

      <Section title="3. Цены и конфигуратор">
        <p>
          Цены, указанные в каталоге (за погонный метр или «цена по
          запросу»), — ориентировочные и рассчитаны по стандартной
          комплектации. Итоговая стоимость зависит от размеров помещения,
          выбранной фурнитуры, цвета и других параметров и подтверждается
          после замера.
        </p>
      </Section>

      <Section title="4. Личный кабинет">
        <p>
          Регистрируя аккаунт, вы несёте ответственность за сохранность
          пароля. Если вы подозреваете, что доступ к аккаунту получил кто‑то
          посторонний, свяжитесь с нами через{" "}
          <a href="/contacts" className="text-navy underline">
            контакты
          </a>
          .
        </p>
      </Section>

      <Section title="5. Доставка, оплата и гарантия">
        <p>
          Сроки изготовления и доставки, варианты оплаты и гарантийные
          условия уточняются менеджером индивидуально по каждому заказу —
          подробнее на странице{" "}
          <a href="/delivery" className="text-navy underline">
            «Доставка и оплата»
          </a>
          .
        </p>
      </Section>

      <Section title="6. Изменения условий">
        <p>
          Мы можем обновлять эти условия — актуальная версия всегда доступна
          по этому адресу.
        </p>
      </Section>

      <Section title="7. Обработка персональных данных">
        <p>
          Правила сбора и использования персональных данных описаны в{" "}
          <a href="/privacy" className="text-navy underline">
            Политике конфиденциальности
          </a>
          .
        </p>
      </Section>
    </div>
  );
}
