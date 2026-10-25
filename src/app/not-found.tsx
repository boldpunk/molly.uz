import { connection } from "next/server";
import { SiteChrome } from "@/components/site-chrome";
import { NotFoundView } from "@/components/not-found-view";

export const metadata = {
  title: "Страница не найдена — Molly Home",
  robots: { index: false, follow: true },
};

// Unknown addresses land here outside the (site) layout, so the page brings
// its own header and footer — and, unlike a page-level notFound(), answers
// with a real 404 status.
export default async function NotFound() {
  // Rendered per request, so the menu matches the live catalog instead of
  // being frozen into the build.
  await connection();
  return (
    <SiteChrome>
      <NotFoundView />
    </SiteChrome>
  );
}
