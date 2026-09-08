"use client";

import { ADMIN_ROLE_LABELS } from "@/lib/admin-role-labels";

const ERROR_MESSAGES: Record<string, string> = {
  invalid: "Заполните имя, email и пароль (минимум 8 символов).",
  email_taken: "Этот email уже используется другим пользователем.",
  last_admin: "Нельзя убрать роль администратора у последнего администратора.",
};

export function AdminUserForm({
  action,
  user,
  error,
}: {
  action: (formData: FormData) => void;
  user?: { name: string; email: string; role: string };
  error?: string;
}) {
  return (
    <form
      action={action}
      className="max-w-2xl rounded-xl border border-navy/10 bg-white p-6 shadow-sm"
    >
      {error && ERROR_MESSAGES[error] && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
          {ERROR_MESSAGES[error]}
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
          <span className="font-medium text-navy">Имя</span>
          <input
            required
            name="name"
            defaultValue={user?.name}
            className="input"
            placeholder="Как к вам обращаться"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
          <span className="font-medium text-navy">Email</span>
          <input
            required
            type="email"
            name="email"
            defaultValue={user?.email}
            className="input"
            placeholder="name@molly.uz"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-navy">Роль</span>
          <select name="role" defaultValue={user?.role ?? "content_editor"} className="input">
            {Object.entries(ADMIN_ROLE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-navy">
            {user ? "Новый пароль" : "Пароль"}
          </span>
          <input
            type="password"
            name="password"
            required={!user}
            minLength={8}
            className="input"
            placeholder={user ? "Оставьте пустым, чтобы не менять" : "Минимум 8 символов"}
          />
        </label>
      </div>

      <div className="mt-6 flex items-center gap-3 border-t border-navy/10 pt-5">
        <button
          type="submit"
          className="rounded-full bg-navy px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-navy/90 hover:shadow"
        >
          Сохранить
        </button>
      </div>
    </form>
  );
}
