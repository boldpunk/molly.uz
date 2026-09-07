import Link from "next/link";
import { logout } from "@/lib/admin-auth-actions";

const NAV_ITEMS = [
  { href: "/admin", label: "Дашборд" },
  { href: "/admin/requests", label: "Заявки" },
  { href: "/admin/products", label: "Товары" },
  { href: "/admin/categories", label: "Категории" },
];

export const metadata = { title: "Mebelflow" };

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="flex w-56 shrink-0 flex-col border-r border-navy/10 bg-white px-4 py-6">
        <span className="font-heading px-2 text-lg font-bold text-navy">
          Mebelflow
        </span>
        <nav className="mt-8 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-navy/70 hover:bg-navy/5 hover:text-navy"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <form action={logout} className="mt-auto">
          <button
            type="submit"
            className="w-full rounded-md px-3 py-2 text-left text-sm text-navy/50 hover:bg-navy/5 hover:text-navy"
          >
            Выйти
          </button>
        </form>
      </aside>
      <div className="flex-1 bg-navy/[0.02] px-8 py-8">{children}</div>
    </div>
  );
}
