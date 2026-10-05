import { SiteChrome } from "@/components/site-chrome";
import { NotFoundView } from "@/components/not-found-view";

export const metadata = {
  title: "Страница не найдена — Molly Home",
  robots: { index: false, follow: true },
};

// Unknown addresses land here outside the (site) layout, so the page brings
// its own header and footer — and, unlike a page-level notFound(), answers
// with a real 404 status.
export default function NotFound() {
  return (
    <SiteChrome>
      <NotFoundView />
    </SiteChrome>
  );
}
