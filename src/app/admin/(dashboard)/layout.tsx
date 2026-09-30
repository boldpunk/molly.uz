import { redirect } from "next/navigation";
import { count, eq } from "drizzle-orm";
import { db } from "@/db";
import { requests } from "@/db/schema";
import { AdminSidebar } from "@/components/admin/sidebar";
import { getCurrentAdmin } from "@/lib/admin-users";
import { getBrandAssets } from "@/lib/brand";

export const metadata = { title: "Molly Home — админ" };
export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const [brand, [newRequests]] = await Promise.all([
    getBrandAssets(),
    db.select({ total: count() }).from(requests).where(eq(requests.status, "new_order")),
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f4ef] md:flex-row">
      <AdminSidebar
        admin={admin}
        logoSrc={brand.reversed}
        logoScale={brand.scale}
        newRequests={newRequests?.total ?? 0}
      />
      <div className="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8 md:px-10 md:py-10">
        <div className="mx-auto max-w-7xl">{children}</div>
      </div>
    </div>
  );
}
