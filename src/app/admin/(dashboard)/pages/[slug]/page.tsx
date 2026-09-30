import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { pageRevisions } from "@/db/schema";
import { getPageBySlug } from "@/lib/data";
import { restorePageRevision, updatePage } from "@/lib/admin-actions";
import { RestoreRevisionButton } from "@/components/admin/restore-revision-button";
import { PageHeader } from "@/components/admin/page-header";
import { FormSection } from "@/components/admin/form-section";
import { PageBlocksEditor } from "@/components/admin/page-blocks-editor";
import { HomeContentForm } from "@/components/admin/home-content-form";
import { ContactContentForm } from "@/components/admin/contact-content-form";

export const dynamic = "force-dynamic";

export default async function EditPagePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ restored?: string }>;
}) {
  const [{ slug }, { restored }] = await Promise.all([params, searchParams]);
  const [page, revisions] = await Promise.all([
    getPageBySlug(slug),
    db
      .select({
        id: pageRevisions.id,
        title: pageRevisions.title,
        blocks: pageRevisions.blocks,
        savedBy: pageRevisions.savedBy,
        createdAt: pageRevisions.createdAt,
      })
      .from(pageRevisions)
      .where(eq(pageRevisions.pageSlug, slug))
      .orderBy(desc(pageRevisions.createdAt))
      .limit(15),
  ]);
  if (!page) notFound();

  const updateWithSlug = updatePage.bind(null, slug);
  const liveUrl = slug === "home" ? "/" : `/${page.slug}`;

  return (
    <div>
      <PageHeader
        title={page.title}
        description={liveUrl}
        back={{ href: "/admin/pages", label: "Страницы" }}
      />

      {restored && (
        <p className="mt-6 max-w-2xl rounded-2xl bg-sage-light px-5 py-3 text-sm font-medium text-sage">
          Версия восстановлена — страница на сайте уже обновилась.
        </p>
      )}

      <form action={updateWithSlug} className="mt-6 flex max-w-2xl flex-col gap-6">
        <FormSection title="Название страницы">
          <input
            required
            name="title"
            defaultValue={page.title}
            className="input"
          />
        </FormSection>

        {slug === "home" ? (
          <HomeContentForm name="blocksJson" initialBlocks={page.blocks} />
        ) : slug === "contacts" ? (
          <ContactContentForm name="blocksJson" initialBlocks={page.blocks} />
        ) : (
          <FormSection
            title="Содержимое"
            description="Добавляйте, удаляйте и переставляйте блоки — изменения появятся на сайте после сохранения"
          >
            <PageBlocksEditor name="blocksJson" initialBlocks={page.blocks} />
          </FormSection>
        )}

        <FormSection
          title="SEO"
          description="Заголовок и описание для поисковиков — необязательно, по умолчанию используется название страницы"
        >
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-navy">Meta-заголовок</span>
            <input
              name="metaTitle"
              defaultValue={page.metaTitle ?? ""}
              className="input"
              placeholder={`${page.title} — Molly Home`}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-navy">Meta-описание</span>
            <textarea
              name="metaDescription"
              defaultValue={page.metaDescription ?? ""}
              rows={2}
              className="input"
            />
          </label>
        </FormSection>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="rounded-full bg-navy px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-navy/90 hover:shadow"
          >
            Сохранить
          </button>
          <a
            href={liveUrl}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-medium text-navy/50 hover:text-navy"
          >
            Открыть страницу на сайте →
          </a>
        </div>
      </form>

      <section className="mt-10 max-w-2xl rounded-[1.5rem] border border-navy/[0.07] bg-white p-6">
        <h2 className="font-heading text-lg font-bold text-navy">История изменений</h2>
        <p className="mt-1 text-sm text-navy/50">
          Перед каждым сохранением прошлая версия страницы попадает сюда — её можно вернуть в один клик.
        </p>
        {revisions.length === 0 ? (
          <p className="mt-5 text-sm text-navy/40">Сохранённых версий пока нет.</p>
        ) : (
          <ul className="mt-5 divide-y divide-navy/5">
            {revisions.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-4 py-3">
                <span className="min-w-0 text-sm">
                  <span className="block font-semibold text-navy">
                    {r.createdAt.toLocaleString("ru-RU", {
                      timeZone: "Asia/Tashkent",
                      day: "numeric",
                      month: "long",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span className="block truncate text-xs text-navy/45">
                    {r.savedBy ? `${r.savedBy} · ` : ""}
                    {r.title} · блоков: {r.blocks.length}
                  </span>
                </span>
                <RestoreRevisionButton action={restorePageRevision.bind(null, r.id)} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
