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
      <div className="mx-auto max-w-3xl px-6 py-14">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-bold text-navy">
              Здравствуйте, {customer.name}
            </h1>
            <p className="mt-1 text-sm text-navy/60">{customer.phone}</p>
          </div>
          <form action={logoutCustomer}>
            <button
              type="submit"
              className="rounded-full border border-navy/15 px-5 py-2.5 text-sm font-semibold text-navy hover:bg-navy/5"
            >
              Выйти
            </button>
          </form>
        </div>

        <h2 className="font-heading mt-10 text-lg font-bold text-navy">
          Мои заявки
        </h2>
        {myRequests.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-navy/20 bg-navy/[0.02] px-6 py-14 text-center">
            <p className="text-sm text-navy/60">Заявок пока нет.</p>
            <Link
              href="/catalog/kuhonnaya-mebel"
              className="mt-6 inline-block rounded-full bg-navy px-6 py-3 text-sm font-semibold text-white hover:bg-navy/90"
            >
              Перейти в каталог
            </Link>
          </div>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {myRequests.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/account/orders/${r.id}`}
                  className="flex items-center justify-between gap-4 rounded-xl border border-navy/10 bg-white p-4 transition hover:border-navy/20"
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
                    <div className="relative aspect-square w-full overflow-hidden rounded-lg">
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
    <div className="mx-auto max-w-sm px-6 py-14">
      <h1 className="font-heading text-2xl font-bold text-navy">
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
            className="mt-1 rounded-full bg-navy px-6 py-2.5 text-sm font-semibold text-white hover:bg-navy/90"
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
            className="mt-1 rounded-full bg-navy px-6 py-2.5 text-sm font-semibold text-white hover:bg-navy/90"
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
  );
}
