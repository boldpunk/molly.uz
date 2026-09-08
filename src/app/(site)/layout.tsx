import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { RequestListProvider } from "@/lib/request-list-context";
import { getCategories, getPageBySlug } from "@/lib/data";

const DEFAULT_PHONE = "+998 94 608 50 05";

function contactPhone(blocks: import("@/db/schema").PageBlock[] | undefined) {
  const block = blocks?.find((b) => b.type === "contact_info");
  return (block?.type === "contact_info" && block.phone) || DEFAULT_PHONE;
}

// Header/footer nav reads categories from the (admin-editable) database on
// every request, so the storefront renders dynamically rather than baking
// catalog navigation into a static build.
export const dynamic = "force-dynamic";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [categories, contacts] = await Promise.all([
    getCategories(),
    getPageBySlug("contacts"),
  ]);
  const phone = contactPhone(contacts?.blocks);

  return (
    <RequestListProvider>
      <Header categories={categories} phone={phone} />
      <main className="flex-1">{children}</main>
      <Footer categories={categories} phone={phone} />
    </RequestListProvider>
  );
}
