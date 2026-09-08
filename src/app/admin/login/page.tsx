import Link from "next/link";
import { login } from "@/lib/admin-auth-actions";
import { Logo } from "@/components/logo";

export const metadata = { title: "Вход — Molly Home" };

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next = "/admin", error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy/[0.025] px-6">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <Logo size={56} />
          <p className="mt-3 text-sm text-navy/50">Панель управления</p>
        </div>

        <div className="rounded-xl border border-navy/10 bg-white p-6 shadow-sm">
          {error && (
            <p className="mb-4 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
              Неверный пароль.
            </p>
          )}

          <form action={login} className="flex flex-col gap-4">
            <input type="hidden" name="next" value={next} />
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-navy">Пароль</span>
              <input
                required
                type="password"
                name="password"
                autoFocus
                className="input"
              />
            </label>
            <button
              type="submit"
              className="rounded-full bg-navy px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-navy/90 hover:shadow"
            >
              Войти
            </button>
          </form>
        </div>

        <div className="mt-6 flex flex-col items-center gap-1 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-navy/60 hover:text-navy"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path
                d="M19 12H5m0 0 6-6m-6 6 6 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Вернуться на сайт
          </Link>
          <p className="mt-4 text-xs text-navy/30">
            © {new Date().getFullYear()} Molly Home
          </p>
        </div>
      </div>
    </div>
  );
}
