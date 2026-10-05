import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import { SITE_URL } from "@/lib/site";

export const metadata = {
  title: "Политика конфиденциальности — Molly Home",
  alternates: { canonical: `${SITE_URL}/privacy` },
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <h2 className="font-heading text-xl font-bold tracking-tight text-navy">{title}</h2>
      <div className="mt-3 flex flex-col gap-3 text-base leading-relaxed text-navy/70">
        {children}
      </div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <>
    <PageHero eyebrow="Документы" title="Политика конфиденциальности" text="Действует с 2026 года" />
    <article className="mx-auto max-w-3xl px-6 pb-16 pt-6">

      <Section title="1. Общие положения">
        <p>
          Настоящая политика описывает, какие персональные данные собирает
          molly.uz («сайт», «мы»), как они используются и хранятся. Используя
          сайт и отправляя формы (заявка на замер, регистрация аккаунта), вы
          соглашаетесь с условиями, описанными ниже.
        </p>
      </Section>

      <Section title="2. Какие данные мы собираем">
        <p>При использовании сайта мы можем получать:</p>
        <ul className="ml-4 list-disc">
          <li>имя и номер телефона — при отправке заявки на замер;</li>
          <li>
            имя, номер телефона и пароль — при регистрации личного кабинета
            (пароль хранится в виде необратимого хеша, а не в открытом виде);
          </li>
          <li>
            состав и параметры заявки — выбранные товары, фурнитура, цвет,
            ширина, комментарий;
          </li>
          <li>
            техническую информацию браузера (для корректной работы сайта) —
            без использования сторонних рекламных трекеров.
          </li>
        </ul>
      </Section>

      <Section title="3. Для чего используются данные">
        <p>Собранные данные используются исключительно для того, чтобы:</p>
        <ul className="ml-4 list-disc">
          <li>связаться с вами по заявке и согласовать замер;</li>
          <li>
            показать историю ваших заявок в личном кабинете, если вы
            зарегистрированы;
          </li>
          <li>
            улучшать работу сайта и каталога Molly Home.
          </li>
        </ul>
        <p>
          Мы не продаём и не передаём ваши данные третьим лицам для
          маркетинговых целей.
        </p>
      </Section>

      <Section title="4. Хранение и защита данных">
        <p>
          Данные хранятся в защищённой базе данных с ограниченным доступом.
          Пароли личного кабинета хешируются и не могут быть восстановлены в
          исходном виде даже нами. Сессия входа подтверждается подписанным
          cookie‑файлом.
        </p>
      </Section>

      <Section title="5. Локальное хранилище браузера">
        <p>
          Список товаров для заявки (пока вы её не отправили) и выбранный
          район города сохраняются в локальном хранилище вашего браузера
          (localStorage) — эти данные не покидают ваше устройство и не
          передаются на сервер, пока вы сами не отправите заявку.
        </p>
      </Section>

      <Section title="6. Ваши права">
        <p>
          Вы можете запросить удаление или исправление своих данных,
          написав нам через{" "}
          <Link href="/contacts" className="text-navy underline">
            контакты
          </Link>{" "}
          или в Telegram{" "}
          <a
            href="https://t.me/mollyhomeuzbot"
            target="_blank"
            rel="noreferrer"
            className="text-navy underline"
          >
            @mollyhomeuzbot
          </a>
          .
        </p>
      </Section>

      <Section title="7. Изменения политики">
        <p>
          Мы можем обновлять эту страницу — актуальная версия всегда
          доступна по этому адресу. Дата последнего обновления указана в
          начале страницы.
        </p>
      </Section>
    </article>
    </>
  );
}
