import { login } from "@/lib/admin-auth-actions";

export const metadata = { title: "Вход — Mebelflow" };

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next = "/admin", error } = await searchParams;

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-6">
      <div className="w-full max-w-sm rounded-xl border border-navy/10 bg-white p-6 shadow-sm">
        <h1 className="font-heading text-xl font-bold text-navy">
          Mebelflow
        </h1>
        <p className="mt-1 text-sm text-navy/60">
          Вход в панель управления Molly Home.
        </p>

        {error && (
          <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            Неверный пароль.
          </p>
        )}

        <form action={login} className="mt-6 flex flex-col gap-4">
          <input type="hidden" name="next" value={next} />
          <div>
            <label className="text-sm font-medium text-navy">Пароль</label>
            <input
              required
              type="password"
              name="password"
              autoFocus
              className="mt-1 w-full rounded-md border border-navy/15 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="rounded-full bg-navy px-6 py-3 text-sm font-semibold text-white hover:bg-navy/90"
          >
            Войти
          </button>
        </form>
      </div>
    </div>
  );
}
