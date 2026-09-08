import type { Metadata } from "next";
import type { Page } from "@/lib/data";

export function pageMetadata(
  page: Page | undefined,
  fallbackTitle: string,
  fallbackDescription?: string
): Metadata {
  return {
    title: page?.metaTitle || fallbackTitle,
    description: page?.metaDescription || fallbackDescription,
  };
}
