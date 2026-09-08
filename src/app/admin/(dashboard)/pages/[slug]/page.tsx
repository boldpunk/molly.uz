import { notFound } from "next/navigation";
import { getPageBySlug } from "@/lib/data";
import { updatePage } from "@/lib/admin-actions";
import { PageHeader } from "@/components/admin/page-header";
import { FormSection } from "@/components/admin/form-section";
import { PageBlocksEditor } from "@/components/admin/page-blocks-editor";
import { HomeContentForm } from "@/components/admin/home-content-form";

export const dynamic = "force-dynamic";

export default async function EditPagePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = await getPageBySlug(slug);
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
        ) : (
          <FormSection
            title="Содержимое"
            description="Добавляйте, удаляйте и переставляйте блоки — изменения появятся на сайте после сохранения"
          >
            <PageBlocksEditor name="blocksJson" initialBlocks={page.blocks} />
          </FormSection>
        )}

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
    </div>
  );
}
