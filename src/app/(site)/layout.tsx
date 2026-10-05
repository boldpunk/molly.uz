import { SiteChrome } from "@/components/site-chrome";

// Header/footer nav reads categories from the (admin-editable) database on
// every request, so the storefront renders dynamically rather than baking
// catalog navigation into a static build.
export const dynamic = "force-dynamic";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SiteChrome>{children}</SiteChrome>;
}
