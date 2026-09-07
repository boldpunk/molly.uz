import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { RequestListProvider } from "@/lib/request-list-context";
import { getCategories } from "@/lib/data";

// Header/footer nav reads categories from the (admin-editable) database on
// every request, so the storefront renders dynamically rather than baking
// catalog navigation into a static build.
export const dynamic = "force-dynamic";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const categories = await getCategories();

  return (
    <RequestListProvider>
      <Header categories={categories} />
      <main className="flex-1">{children}</main>
      <Footer categories={categories} />
    </RequestListProvider>
  );
}
