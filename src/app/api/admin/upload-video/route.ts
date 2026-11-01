import { randomBytes } from "node:crypto";
import { appendFile, copyFile, mkdir, open, rename, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { requireRole, ROLES } from "@/lib/admin-guard";
import { VIDEO_CHUNK_BYTES, VIDEO_MAX_BYTES } from "@/lib/video-upload";

export const dynamic = "force-dynamic";

// Videos arrive in chunks: nginx caps a request body at 10 MB and a phone
// clip is often larger. Each chunk is appended to a part file; the last one
// checks the file really is a video and moves it under /uploads/videos,
// which nginx serves directly (with range requests for seeking).
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), "public", "uploads");
const PARTS_DIR = path.join(os.tmpdir(), "molly-video-parts");

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

async function sniffExtension(file: string): Promise<"mp4" | "webm" | null> {
  const handle = await open(file, "r");
  try {
    const head = Buffer.alloc(12);
    await handle.read(head, 0, 12, 0);
    if (head.subarray(4, 8).toString("latin1") === "ftyp") return "mp4";
    if (head.readUInt32BE(0) === 0x1a45dfa3) return "webm";
    return null;
  } finally {
    await handle.close();
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole(ROLES.content);
  } catch {
    return bad("Нет доступа", 401);
  }

  const params = req.nextUrl.searchParams;
  const id = params.get("id") ?? "";
  const index = Number(params.get("index"));
  const total = Number(params.get("total"));
  const name = params.get("name") ?? "video";
  if (!/^[a-f0-9]{16,32}$/.test(id)) return bad("Неверный идентификатор загрузки");
  if (!Number.isInteger(total) || total < 1 || total * VIDEO_CHUNK_BYTES > VIDEO_MAX_BYTES + VIDEO_CHUNK_BYTES) {
    return bad(`Видео больше ${Math.round(VIDEO_MAX_BYTES / 1024 / 1024)} МБ`);
  }
  if (!Number.isInteger(index) || index < 0 || index >= total) return bad("Неверный номер части");

  const chunk = Buffer.from(await req.arrayBuffer());
  if (chunk.length === 0 || chunk.length > VIDEO_CHUNK_BYTES) return bad("Неверный размер части");
  if (index < total - 1 && chunk.length !== VIDEO_CHUNK_BYTES) return bad("Неверный размер части");

  await mkdir(PARTS_DIR, { recursive: true });
  const partFile = path.join(PARTS_DIR, `${id}.part`);
  // Chunks must arrive in order; anything else restarts the upload.
  const have = index === 0 ? 0 : await stat(partFile).then((s) => s.size).catch(() => -1);
  if (have !== index * VIDEO_CHUNK_BYTES) {
    await rm(partFile, { force: true });
    return bad("Загрузка прервалась — попробуйте ещё раз", 409);
  }
  if (index === 0) await rm(partFile, { force: true });
  await appendFile(partFile, chunk);

  if (index < total - 1) return NextResponse.json({ ok: true });

  const ext = await sniffExtension(partFile);
  if (!ext) {
    await rm(partFile, { force: true });
    return bad("Это не видео MP4 или WebM");
  }
  const base = path.basename(name).replace(/\.[^.]*$/, "").replace(/[^a-zA-Z0-9\-]/g, "_").slice(0, 40) || "video";
  const filename = `${base}-${randomBytes(8).toString("hex")}.${ext}`;
  const dir = path.join(UPLOAD_DIR, "videos");
  await mkdir(dir, { recursive: true });
  // The part file lives on a different filesystem than the uploads mount, so
  // rename can fail across devices; fall back to a copy.
  const target = path.join(dir, filename);
  try {
    await rename(partFile, target);
  } catch {
    await copyFile(partFile, target);
    await rm(partFile, { force: true });
  }
  return NextResponse.json({ url: `/uploads/videos/${filename}` });
}
