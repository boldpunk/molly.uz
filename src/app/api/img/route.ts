import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";

// Resizes storefront photos to the width the browser asked for and serves
// them as WebP. Next's own optimizer can't read files uploaded after the
// server started (it only serves the public folder as it was at boot), so
// admin uploads used to go out as full-size PNGs of up to 1 MB each. This
// reads from disk on every miss, so fresh uploads work too.

export const runtime = "nodejs";

const WIDTHS = new Set([256, 384, 640, 750, 828, 1080, 1200, 1920, 2048]);
const QUALITIES = new Set([60, 75, 85]);
const PUBLIC_DIR = path.join(process.cwd(), "public");
const CACHE_DIR = path.join(os.tmpdir(), "molly-img-cache");
const REMOTE_HOST = /\.public\.blob\.vercel-storage\.com$/;
const MAX_SOURCE_BYTES = 25 * 1024 * 1024;

async function loadSource(src: string): Promise<Buffer | null> {
  if (src.startsWith("/")) {
    const file = path.normalize(path.join(PUBLIC_DIR, decodeURIComponent(src)));
    if (!file.startsWith(PUBLIC_DIR + path.sep)) return null;
    try {
      const info = await stat(file);
      if (!info.isFile() || info.size > MAX_SOURCE_BYTES) return null;
      return await readFile(file);
    } catch {
      return null;
    }
  }

  let url: URL;
  try {
    url = new URL(src);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || !REMOTE_HOST.test(url.hostname)) return null;
  const res = await fetch(url, { signal: AbortSignal.timeout(15_000) }).catch(() => null);
  if (!res?.ok) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  return buf.length > MAX_SOURCE_BYTES ? null : buf;
}

export async function GET(req: NextRequest) {
  const src = req.nextUrl.searchParams.get("src") ?? "";
  const width = Number(req.nextUrl.searchParams.get("w"));
  const quality = Number(req.nextUrl.searchParams.get("q") ?? 75);
  if (!src || !WIDTHS.has(width) || !QUALITIES.has(quality)) {
    return new NextResponse("Bad image request", { status: 400 });
  }

  // Uploaded and blob files carry a content hash in their name, so they never
  // change; bundled /images files can be replaced by a deploy.
  const immutable = src.startsWith("/uploads/") || !src.startsWith("/");
  const headers = {
    "Content-Type": "image/webp",
    "Cache-Control": immutable
      ? "public, max-age=31536000, immutable"
      : "public, max-age=86400, stale-while-revalidate=604800",
  };

  const key = createHash("sha1").update(`${src}|${width}|${quality}`).digest("hex");
  const cacheFile = path.join(CACHE_DIR, `${key}.webp`);
  const hit = await readFile(cacheFile).catch(() => null);
  if (hit) return new NextResponse(new Uint8Array(hit), { headers });

  const source = await loadSource(src);
  if (!source) return new NextResponse("Not found", { status: 404 });

  let output: Buffer;
  try {
    output = await sharp(source)
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality })
      .toBuffer();
  } catch {
    return new NextResponse("Unsupported image", { status: 415 });
  }

  await mkdir(CACHE_DIR, { recursive: true })
    .then(() => writeFile(cacheFile, output))
    .catch(() => {});
  return new NextResponse(new Uint8Array(output), { headers });
}
