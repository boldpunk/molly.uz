/**
 * Locally-uploaded product photos (served directly by nginx from a bind
 * mount — see docker-compose.yml / nginx's /uploads/ location) must never
 * go through Next's built-in image optimizer: that runs inside the app
 * itself, and if it's asked to resize a file moments after upload (the
 * normal case — the admin form redirects straight to a page showing it),
 * it can fail to read the just-written file and there's no reliable retry
 * path. Serving the original file as-is is instant and fully reliable.
 */
export function isLocalUpload(src?: string | null): boolean {
  return typeof src === "string" && src.startsWith("/uploads/");
}
