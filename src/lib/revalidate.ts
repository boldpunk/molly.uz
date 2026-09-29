import { revalidatePath as nextRevalidatePath } from "next/cache";
import { clearDataCache } from "./data-cache";

// Admin edits go through here so the in-memory storefront cache is dropped
// together with Next's page cache — the next visitor sees the change at once.
export function revalidatePath(
  ...args: Parameters<typeof nextRevalidatePath>
): ReturnType<typeof nextRevalidatePath> {
  clearDataCache();
  return nextRevalidatePath(...args);
}
