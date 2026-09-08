import { AdminUserForm } from "@/components/admin/admin-user-form";
import { createAdminUser } from "@/lib/admin-users-actions";
import { PageHeader } from "@/components/admin/page-header";

export default async function NewAdminUserPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <div>
      <PageHeader
        title="Новый пользователь"
        back={{ href: "/admin/users", label: "Пользователи" }}
      />
      <div className="mt-6">
        <AdminUserForm action={createAdminUser} error={error} />
      </div>
    </div>
  );
}
