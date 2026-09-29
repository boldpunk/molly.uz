import Image from "next/image";
import Link from "next/link";
import { getCurrentCustomer, getCustomerRequests } from "@/lib/customers";
import { getFavouriteProducts } from "@/lib/data";
import {
  loginCustomer,
  logoutCustomer,
  registerCustomer,
} from "@/lib/customer-auth-actions";
import { removeFavourite } from "@/lib/favourites-actions";
import { StatusBadge } from "@/components/admin/status-badge";
import { PlaceholderImage } from "@/components/placeholder-image";
import { PhoneInput } from "@/components/phone-input";
import { RequestStatus } from "@/lib/types";

export const metadata = { title: "Аккаунт — Molly Home" };
export const dynamic = "force-dynamic";

const ERROR_MESSAGES: Record<string, string> = {
  invalid: "Заполните имя, телефон и пароль (минимум 6 символов).",
  phone_taken: "Этот номер телефона уже зарегистрирован. Войдите в аккаунт.",
  invalid_login: "Неверный телефон или пароль.",
};

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; error?: string }>;
}) {
  const customer = await getCurrentCustomer();
  const { mode, error } = await searchParams;

  if (customer) {
    const [myRequests, favourites] = await Promise.all([
      getCustomerRequests(customer.id),
      getFavouriteProducts(customer.id),
    ]);
    return (
      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-[2rem] bg-cream-light p-7 sm:p-9">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-navy font-heading text-xl font-bold text-cream">
              {customer.name.trim().charAt(0).toUpperCase() || "M"}
            </span>
            <div>
              <h1 className="font-heading text-2xl font-bold tracking-tight text-navy sm:text-3xl">
                Здравствуйте, {customer.name}
              </h1>
              <p className="mt-1 text-sm text-navy/60">{customer.phone}</p>
            </div>
          </div>
          <form action={logoutCustomer}>
            <button
              type="submit"
              className="btn btn-outline bg-white px-5 py-2.5"
            >
              Выйти
            </button>
          </form>
        </div>

        <h2 className="font-heading mt-12 text-2xl font-bold tracking-tight text-navy">
          Мои заявки
        </h2>
        {myRequests.length === 0 ? (
          <div className="mt-4 rounded-3xl border border-dashed border-navy/20 bg-cream-light/50 px-6 py-14 text-center">
            <p className="text-sm text-navy/60">Заявок пока нет.</p>
            <Link href="/catalog" className="btn btn-primary mt-6">
              Перейти в каталог
            </Link>
          </div>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {myRequests.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/account/orders/${r.id}`}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-navy/10 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-navy/10"
                >
                  <div>
                    <p className="text-sm font-medium text-navy">
                      {new Date(r.createdAt).toLocaleDateString("ru-RU", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                    <p className="mt-1 text-xs text-navy/60">
                      {r.itemCount} {r.itemCount === 1 ? "товар" : "товара(ов)"}
                      {r.notes ? ` · ${r.notes}` : ""}
                    </p>
                  </div>
                  <StatusBadge status={r.status as RequestStatus} />
                </Link>
              </li>
            ))}
          </ul>
        )}

        <h2 className="font-heading mt-10 text-lg font-bold text-navy">
          Избранное
        </h2>
        {favourites.length === 0 ? (
          <p className="mt-4 text-sm text-navy/60">
            Пока ничего не добавлено — нажмите «В избранное» на странице
            товара.
          </p>
        ) : (
          <ul className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            {favourites.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/catalog/${p.categorySlug}/${p.slug}`}
                  className="group flex flex-col gap-2"
                >
                  {p.imageUrl ? (
                    <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-cream-light">
                      <Image
                        src={p.imageUrl}
                        alt={p.name}
                        fill
                        sizes="(min-width: 768px) 25vw, 50vw"
                        className="object-cover transition group-hover:scale-[1.01]"
                      />
                    </div>
                  ) : (
                    <PlaceholderImage label={p.name} aspect="aspect-square" />
                  )}
                  <span className="text-sm font-medium text-navy">
                    {p.name}
                  </span>
                </Link>
                <form action={removeFavourite.bind(null, p.id)} className="mt-1">
                  <button
                    type="submit"
                    className="text-xs font-medium text-navy/40 hover:text-red-600"
                  >
                    Убрать из избранного
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  const showRegister = mode === "register";

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
    <div className="grid overflow-hidden rounded-[2rem] border border-navy/10 bg-white shadow-2xl shadow-navy/[0.06] md:grid-cols-2">
    <div className="relative hidden overflow-hidden bg-navy p-10 text-white md:block">
      <div aria-hidden className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-clay/30 blur-2xl" />
      <span className="relative text-xs font-semibold uppercase tracking-[0.16em] text-cream/70">Личный кабинет</span>
      <p className="relative mt-4 font-heading text-3xl font-bold leading-tight">
        Все ваши заявки и избранное — в одном месте
      </p>
      <ul className="relative mt-8 flex flex-col gap-4 text-sm text-white/75">
        {["Статус заявки в реальном времени", "Избранные модели всегда под рукой", "История заказов и замеров"].map((t) => (
          <li key={t} className="flex items-center gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cream text-navy">
              <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" aria-hidden>
                <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            {t}
          </li>
        ))}
      </ul>
    </div>
    <div className="p-7 sm:p-10">
      <h1 className="font-heading text-3xl font-bold tracking-tight text-navy">
        {showRegister ? "Регистрация" : "Вход в аккаунт"}
      </h1>
      <p className="mt-2 text-sm text-navy/60">
        {showRegister
          ? "Создайте аккаунт, чтобы отслеживать статус ваших заявок."
          : "Войдите, чтобы увидеть историю заявок."}
      </p>

      {error && ERROR_MESSAGES[error] && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
          {ERROR_MESSAGES[error]}
        </p>
      )}

      {showRegister ? (
        <form action={registerCustomer} className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-navy">Имя</span>
            <input required name="name" className="input" placeholder="Как к вам обращаться" />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-navy">Телефон</span>
            <PhoneInput required name="phone" />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-navy">Пароль</span>
            <input
              required
              type="password"
              name="password"
              minLength={6}
              className="input"
              placeholder="Минимум 6 символов"
            />
          </label>
          <button
            type="submit"
            className="btn btn-primary mt-1"
          >
            Зарегистрироваться
          </button>
          <p className="-mt-2 text-center text-xs text-navy/40">
            Регистрируясь, вы соглашаетесь с{" "}
            <Link href="/privacy" className="underline hover:text-navy">
              политикой конфиденциальности
            </Link>
            .
          </p>
          <p className="text-center text-sm text-navy/60">
            Уже есть аккаунт?{" "}
            <Link href="/account" className="font-medium text-navy hover:underline">
              Войти
            </Link>
          </p>
        </form>
      ) : (
        <form action={loginCustomer} className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-navy">Телефон</span>
            <PhoneInput required name="phone" />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-navy">Пароль</span>
            <input required type="password" name="password" className="input" />
          </label>
          <button
            type="submit"
            className="btn btn-primary mt-1"
          >
            Войти
          </button>
          <p className="text-center text-sm text-navy/60">
            Нет аккаунта?{" "}
            <Link
              href="/account?mode=register"
              className="font-medium text-navy hover:underline"
            >
              Зарегистрироваться
            </Link>
          </p>
        </form>
      )}
    </div>
    </div>
    </div>
  );
}
