import { getTextTemplates } from "@/lib/proposals";
import {
  createTextTemplate,
  updateTextTemplate,
  deleteTextTemplate,
} from "@/lib/proposal-actions";
import {
  PROPOSAL_LANGUAGES,
  PROPOSAL_LANGUAGE_LABELS,
} from "@/lib/proposal-i18n";
import { PageHeader } from "@/components/admin/page-header";
import { FormSection } from "@/components/admin/form-section";
import { TrashIcon } from "@/components/admin/icons";

export const dynamic = "force-dynamic";

const inputClass =
  "w-full rounded-lg border border-navy/10 bg-white px-3 py-2 text-sm text-navy outline-none transition placeholder:text-navy/30 focus:border-navy/30";

export default async function ProposalTemplatesPage() {
  const templates = await getTextTemplates();

  return (
    <div>
      <PageHeader
        title="Библиотека текстов"
        description="Часто используемые финальные тексты для КП. При выборе текст копируется в КП — шаблон остаётся прежним."
        back={{ href: "/admin/proposals", label: "Коммерческие предложения" }}
      />

      <div className="mt-6 flex flex-col gap-6">
        <FormSection title="Новый текст">
          <form action={createTextTemplate} className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-[1fr_200px]">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-navy/60">
                  Название
                </label>
                <input
                  name="name"
                  required
                  placeholder="Стандартная благодарность"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-navy/60">
                  Язык
                </label>
                <select name="language" className={inputClass}>
                  {PROPOSAL_LANGUAGES.map((code) => (
                    <option key={code} value={code}>
                      {PROPOSAL_LANGUAGE_LABELS[code]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-navy/60">
                Текст
              </label>
              <textarea
                name="text"
                required
                rows={3}
                placeholder="Спасибо за доверие! Мы будем рады реализовать этот проект для вас."
                className={`${inputClass} resize-y`}
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-xs text-navy/60">
                <input
                  type="checkbox"
                  name="active"
                  defaultChecked
                  className="h-4 w-4 rounded border-navy/20"
                />
                Показывать при создании КП
              </label>
              <button
                type="submit"
                className="rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy/90"
              >
                Сохранить текст
              </button>
            </div>
          </form>
        </FormSection>

        <FormSection
          title="Сохранённые тексты"
          description={`Всего: ${templates.length}`}
        >
          {templates.length === 0 ? (
            <p className="text-sm text-navy/40">Пока нет сохранённых текстов.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {templates.map((template) => (
                <form
                  key={template.id}
                  action={updateTextTemplate.bind(null, template.id)}
                  className="rounded-xl border border-navy/10 bg-navy/[0.015] p-4"
                >
                  <div className="grid gap-3 sm:grid-cols-[1fr_170px]">
                    <input
                      name="name"
                      defaultValue={template.name}
                      className={inputClass}
                    />
                    <select
                      name="language"
                      defaultValue={template.language}
                      className={inputClass}
                    >
                      {PROPOSAL_LANGUAGES.map((code) => (
                        <option key={code} value={code}>
                          {PROPOSAL_LANGUAGE_LABELS[code]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <textarea
                    name="text"
                    defaultValue={template.text}
                    rows={3}
                    className={`${inputClass} mt-3 resize-y`}
                  />
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-xs text-navy/60">
                        <input
                          type="checkbox"
                          name="active"
                          defaultChecked={template.active}
                          className="h-4 w-4 rounded border-navy/20"
                        />
                        Активен
                      </label>
                      {template.authorName && (
                        <span className="text-[11px] text-navy/35">
                          Автор: {template.authorName}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="submit"
                        className="rounded-full border border-navy/15 px-4 py-1.5 text-xs font-semibold text-navy transition hover:bg-navy/5"
                      >
                        Обновить
                      </button>
                      <button
                        type="submit"
                        formAction={deleteTextTemplate.bind(null, template.id)}
                        aria-label="Удалить текст"
                        className="rounded-md p-1.5 text-navy/40 transition hover:bg-red-50 hover:text-red-600"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </form>
              ))}
            </div>
          )}
        </FormSection>
      </div>
    </div>
  );
}
