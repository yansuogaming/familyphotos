/**
 * Hosts Next.js may optimise images from. Add the backend's media/CDN host here.
 * Images from any other address (pasted URLs, data: and blob: previews) are shown as-is.
 */
export const OPTIMIZED_IMAGE_HOSTS = ["picsum.photos", "fastly.picsum.photos"];

export function canOptimizeImage(src: unknown): boolean {
  if (typeof src !== "string") return true; // static import
  if (src.startsWith("/")) return true;
  try {
    const u = new URL(src);
    return u.protocol === "https:" && OPTIMIZED_IMAGE_HOSTS.includes(u.hostname);
  } catch {
    return false;
  }
}
