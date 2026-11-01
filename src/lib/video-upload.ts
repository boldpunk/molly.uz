// Shared by the admin upload field and /api/admin/upload-video.
export const VIDEO_CHUNK_BYTES = 4 * 1024 * 1024;
export const VIDEO_MAX_BYTES = 60 * 1024 * 1024;

export function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm)(\?|$)/i.test(url);
}
