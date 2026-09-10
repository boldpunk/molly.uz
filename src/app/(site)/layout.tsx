import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { RequestListProvider } from "@/lib/request-list-context";
import { getCategories, getContactInfo } from "@/lib/data";
import { SITE_URL } from "@/lib/site";

// Header/footer nav reads categories from the (admin-editable) database on
// every request, so the storefront renders dynamically rather than baking
// catalog navigation into a static build.
export const dynamic = "force-dynamic";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [categories, contact] = await Promise.all([
    getCategories(),
    getContactInfo(),
  ]);

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "FurnitureStore",
    name: "Molly Home",
    url: SITE_URL,
    telephone: contact.phone,
    email: contact.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: contact.address,
      addressLocality: "Tashkent",
      addressCountry: "UZ",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: contact.mapLat,
      longitude: contact.mapLng,
    },
    sameAs: [
      `https://www.instagram.com/${contact.instagram}`,
      `https://t.me/${contact.telegram}`,
    ],
  };

  return (
    <RequestListProvider>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <Header categories={categories} phone={contact.phone} />
      <main className="flex-1">{children}</main>
      <Footer categories={categories} phone={contact.phone} />
    </RequestListProvider>
  );
}
