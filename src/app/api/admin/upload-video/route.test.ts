import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { VIDEO_CHUNK_BYTES } from "@/lib/video-upload";

const allow = { current: true };
vi.mock("@/lib/admin-guard", () => ({
  ROLES: { content: ["administrator", "content_editor"] },
  requireRole: async () => {
    if (!allow.current) throw new Error("no");
    return { id: "1", name: "Test", email: "t@t", role: "administrator" };
  },
}));

let dir: string;
let POST: (req: NextRequest) => Promise<Response>;

beforeAll(async () => {
  dir = await mkdtemp(path.join(os.tmpdir(), "molly-video-test-"));
  process.env.UPLOAD_DIR = dir;
  ({ POST } = await import("./route"));
});
afterAll(() => rm(dir, { recursive: true, force: true }));

function mp4(size: number): Buffer {
  const buf = Buffer.alloc(size, 7);
  buf.write("ftyp", 4, "latin1");
  return buf;
}

function send(id: string, index: number, total: number, body: Buffer, name = "clip.mp4") {
  const url = `http://localhost/api/admin/upload-video?id=${id}&index=${index}&total=${total}&name=${name}`;
  return POST(new NextRequest(url, { method: "POST", body: new Uint8Array(body) }));
}

describe("chunked video upload", () => {
  it("assembles chunks into one file under /uploads/videos", async () => {
    const file = mp4(VIDEO_CHUNK_BYTES + 1000);
    const id = "a".repeat(24);
    expect((await send(id, 0, 2, file.subarray(0, VIDEO_CHUNK_BYTES))).status).toBe(200);
    const res = await send(id, 1, 2, file.subarray(VIDEO_CHUNK_BYTES));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.url).toMatch(/^\/uploads\/videos\/clip-[a-f0-9]{16}\.mp4$/);
    const saved = await readFile(path.join(dir, data.url.replace("/uploads/", "")));
    expect(saved.equals(file)).toBe(true);
  });

  it("rejects a file that is not a video", async () => {
    const res = await send("b".repeat(24), 0, 1, Buffer.from("<html>not a video</html>"));
    expect(res.status).toBe(400);
    expect(await readdir(path.join(dir, "videos"))).toHaveLength(1);
  });

  it("restarts when a chunk arrives out of order", async () => {
    const res = await send("c".repeat(24), 1, 2, mp4(100));
    expect(res.status).toBe(409);
  });

  it("refuses visitors who are not signed in to the admin", async () => {
    allow.current = false;
    const res = await send("d".repeat(24), 0, 1, mp4(100));
    allow.current = true;
    expect(res.status).toBe(401);
  });

  it("caps the total size", async () => {
    const res = await send("e".repeat(24), 0, 100, mp4(100));
    expect(res.status).toBe(400);
  });
});
