import type { Metadata } from "next";
import type { Page } from "@/lib/data";
import { SITE_URL } from "@/lib/site";

export function pageMetadata(
  page: Page | undefined,
  fallbackTitle: string,
  fallbackDescription?: string,
  image?: string,
  path = ""
): Metadata {
  const title = page?.metaTitle || fallbackTitle;
  const description = page?.metaDescription || fallbackDescription;
  const url = `${SITE_URL}${path}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      images: image ? [image] : undefined,
      siteName: "Molly Home",
      locale: "ru_RU",
      type: "website",
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export function productMetadata({
  title,
  description,
  image,
  url,
}: {
  title: string;
  description?: string;
  image?: string;
  url: string;
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      images: image ? [image] : undefined,
      siteName: "Molly Home",
      locale: "ru_RU",
      type: "website",
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}
