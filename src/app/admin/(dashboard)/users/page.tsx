import Link from "next/link";
import { db } from "@/db";
import { adminUsers } from "@/db/schema";
import { asc } from "drizzle-orm";
import { getCurrentAdmin, ADMIN_ROLE_LABELS } from "@/lib/admin-users";
import { PageHeader } from "@/components/admin/page-header";
import { ArrowRightIcon, UsersIcon } from "@/components/admin/icons";

export const dynamic = "force-dynamic";

const ERROR_MESSAGES: Record<string, string> = {
  self_delete: "Нельзя удалить самого себя, пока вы вошли в систему.",
  last_admin: "Нельзя удалить последнего администратора.",
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [users, current, { error }] = await Promise.all([
    db.select().from(adminUsers).orderBy(asc(adminUsers.name)),
    getCurrentAdmin(),
    searchParams,
  ]);

  return (
    <div>
      <PageHeader
        title="Пользователи"
        description={`${users.length} ${users.length === 1 ? "пользователь" : "пользователей"}`}
        action={{ href: "/admin/users/new", label: "Добавить пользователя" }}
      />

      {error && ERROR_MESSAGES[error] && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
          {ERROR_MESSAGES[error]}
        </p>
      )}

      <div className="mt-6 overflow-hidden rounded-xl border border-navy/10 bg-white shadow-sm">
        {users.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <UsersIcon className="h-8 w-8 text-navy/20" />
            <p className="text-sm text-navy/40">Пользователей пока нет.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-navy/10 bg-navy/[0.02] text-left text-xs uppercase tracking-wide text-navy/50">
              <tr>
                <th className="px-5 py-3 font-medium">Имя</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Роль</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u.id}
                  className="group border-b border-navy/5 transition last:border-0 hover:bg-navy/[0.02]"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-navy">{u.name}</span>
                      {current?.id === u.id && (
                        <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-medium text-accent-dark">
                          это вы
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs text-navy/50">
                    {u.email}
                  </td>
                  <td className="px-5 py-3.5 text-navy/60">
                    {ADMIN_ROLE_LABELS[u.role] ?? u.role}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link
                      href={`/admin/users/${u.id}`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-navy/50 transition hover:text-navy"
                    >
                      Редактировать
                      <ArrowRightIcon className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
