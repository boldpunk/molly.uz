import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/sidebar";
import { getCurrentAdmin } from "@/lib/admin-users";

export const metadata = { title: "Molly Home — админ" };
export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  return (
    <div className="flex min-h-screen flex-col bg-navy/[0.025] md:flex-row">
      <AdminSidebar admin={admin} />
      <div className="flex-1 px-4 py-6 sm:px-6 sm:py-8 md:px-10 md:py-10">
        <div className="mx-auto max-w-6xl">{children}</div>
      </div>
    </div>
  );
}
