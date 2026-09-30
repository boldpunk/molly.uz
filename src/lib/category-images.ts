export const CATEGORY_IMAGES: Record<string, string> = {
  "kuhonnaya-mebel": "/images/categories/kuhonnaya-mebel.jpg",
  "myagkaya-mebel": "/images/categories/myagkaya-mebel.jpg",
  "spalnye-garnitury": "/images/categories/spalnye-garnitury.jpg",
  garderoby: "/images/categories/garderoby.jpg",
  krovati: "/images/categories/krovati.jpg",
};

/** The cover uploaded in the admin, else the bundled photo for the slug. */
export function categoryImage(category: { slug: string; imageUrl?: string | null }): string | undefined {
  return category.imageUrl || CATEGORY_IMAGES[category.slug];
}
