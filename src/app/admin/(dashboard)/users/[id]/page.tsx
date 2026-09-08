import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { adminUsers } from "@/db/schema";
import { AdminUserForm } from "@/components/admin/admin-user-form";
import { updateAdminUser, deleteAdminUser } from "@/lib/admin-users-actions";
import { getCurrentAdmin } from "@/lib/admin-users";
import { PageHeader } from "@/components/admin/page-header";
import { DeleteButton } from "@/components/admin/delete-button";

export default async function EditAdminUserPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;

  const [[row], current] = await Promise.all([
    db.select().from(adminUsers).where(eq(adminUsers.id, id)).limit(1),
    getCurrentAdmin(),
  ]);
  if (!row) notFound();

  const updateWithId = updateAdminUser.bind(null, id);
  const deleteWithId = deleteAdminUser.bind(null, id);
  const isSelf = current?.id === id;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          title={row.name}
          back={{ href: "/admin/users", label: "Пользователи" }}
        />
        {!isSelf && (
          <DeleteButton action={deleteWithId} label="Удалить пользователя" />
        )}
      </div>
      <div className="mt-6">
        <AdminUserForm
          action={updateWithId}
          user={{ name: row.name, email: row.email, role: row.role }}
          error={error}
        />
      </div>
    </div>
  );
}
