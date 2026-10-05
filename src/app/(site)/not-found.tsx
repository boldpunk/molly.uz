import type { Metadata } from "next";
import { NotFoundView } from "@/components/not-found-view";

export const metadata: Metadata = {
  title: "Страница не найдена — Molly Home",
  robots: { index: false, follow: true },
};

export default function SiteNotFound() {
  return <NotFoundView />;
}
