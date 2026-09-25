import type { Metadata } from "next";
import type { Page } from "@/lib/data";
import { SITE_URL } from "@/lib/site";
import { DEFAULT_COMPANY_NAME } from "@/lib/brand-config";

const DEFAULT_OG_IMAGE = "/opengraph-image.png";

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
  // Pages built through generateMetadata don't pick up the app/ image
  // convention, so the branded card is named here instead of leaving those
  // links to arrive in Telegram and Instagram with no preview at all.
  const ogImage = image || DEFAULT_OG_IMAGE;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      images: [ogImage],
      siteName: DEFAULT_COMPANY_NAME,
      locale: "ru_RU",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
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
  const ogImage = image || DEFAULT_OG_IMAGE;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      images: [ogImage],
      siteName: DEFAULT_COMPANY_NAME,
      locale: "ru_RU",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}
