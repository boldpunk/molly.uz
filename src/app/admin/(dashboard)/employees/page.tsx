import { getEmployees, getEmployeeApplications } from "@/lib/data";
import {
  approveEmployeeApplication,
  rejectEmployeeApplication,
  addEmployeeManually,
  removeEmployee,
} from "@/lib/admin-actions";
import { PageHeader } from "@/components/admin/page-header";
import { FormSection } from "@/components/admin/form-section";
import { TrashIcon } from "@/components/admin/icons";

export const dynamic = "force-dynamic";

export default async function AdminEmployeesPage() {
  const [employees, applications] = await Promise.all([
    getEmployees(),
    getEmployeeApplications(),
  ]);

  return (
    <div>
      <PageHeader
        title="Сотрудники"
        description="Кто получает уведомления о заказах и может менять статусы в группе Telegram"
      />

      <div className="mt-6 flex flex-col gap-6">
        {applications.length > 0 && (
          <FormSection
            title="Заявки на подтверждение"
            description="Написали боту «Я менеджер» и указали имя — не получают уведомлений, пока не подтвердите"
          >
            <div className="flex flex-col gap-2">
              {applications.map((a) => (
                <div
                  key={a.id}
                  className="flex flex-wrap items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3"
                >
                  <div className="min-w-[10rem] flex-1">
                    <p className="text-sm font-medium text-navy">{a.name}</p>
                    <p className="font-mono text-xs text-navy/50">
                      Telegram ID: {a.telegramId}
                    </p>
                  </div>
                  <form action={approveEmployeeApplication.bind(null, a.id)}>
                    <button
                      type="submit"
                      className="rounded-full bg-navy px-4 py-1.5 text-xs font-semibold text-white hover:bg-navy/90"
                    >
                      Подтвердить
                    </button>
                  </form>
                  <form action={rejectEmployeeApplication.bind(null, a.id)}>
                    <button
                      type="submit"
                      className="rounded-full border border-navy/15 px-4 py-1.5 text-xs font-medium text-navy/60 hover:bg-navy/5"
                    >
                      Отклонить
                    </button>
                  </form>
                </div>
              ))}
            </div>
          </FormSection>
        )}

        <FormSection
          title="Действующие сотрудники"
          description="Получают карточки новых заказов в личку и могут менять статусы заявок в группе"
        >
          <div className="flex flex-col gap-2">
            {employees.length === 0 && (
              <p className="text-sm text-navy/40">Пока никого нет.</p>
            )}
            {employees.map((e) => (
              <div
                key={e.id}
                className="flex items-center gap-3 rounded-lg border border-navy/10 p-3"
              >
                <div className="min-w-[10rem] flex-1">
                  <p className="text-sm font-medium text-navy">{e.name}</p>
                  <p className="font-mono text-xs text-navy/50">
                    Telegram ID: {e.telegramId}
                  </p>
                </div>
                <form action={removeEmployee.bind(null, e.id)}>
                  <button
                    type="submit"
                    className="flex h-8 w-8 items-center justify-center rounded-md text-navy/40 transition hover:bg-red-50 hover:text-red-600"
                    aria-label="Удалить сотрудника"
                  >
                    <TrashIcon />
                  </button>
                </form>
              </div>
            ))}
          </div>
        </FormSection>

        <FormSection
          title="Добавить вручную"
          description="Если знаете Telegram ID заранее — можно добавить сотрудника без заявки. Узнать свой ID можно, написав боту /chatid"
        >
          <form
            action={addEmployeeManually}
            className="flex flex-wrap items-end gap-3"
          >
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-navy/60">Telegram ID</label>
              <input
                name="telegramId"
                required
                pattern="\d+"
                placeholder="123456789"
                className="input w-40"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-navy/60">Имя</label>
              <input name="name" required placeholder="Имя сотрудника" className="input w-48" />
            </div>
            <button
              type="submit"
              className="rounded-full bg-navy px-5 py-2 text-sm font-semibold text-white hover:bg-navy/90"
            >
              Добавить
            </button>
          </form>
        </FormSection>
      </div>
    </div>
  );
}
