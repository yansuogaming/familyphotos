// Reading image files picked by the admin. In mock mode the result is kept as a
// data URL, so large photos are scaled down to stay inside localStorage.

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const IMAGE_ACCEPT = IMAGE_TYPES.join(",");

/** Returns a message for the admin when the file can't be used, else null. */
export function checkImageFile(file: File): string | null {
  if (!IMAGE_TYPES.includes(file.type)) return `"${file.name}" không phải ảnh JPG, PNG hay WebP.`;
  if (file.size > MAX_IMAGE_BYTES) return `"${file.name}" nặng hơn 5 MB. Hãy chọn ảnh nhỏ hơn.`;
  return null;
}

function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("Không đọc được tệp này."));
    r.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Tệp này không mở được như một tấm ảnh."));
    img.src = src;
  });
}

export interface ReadImage {
  dataUrl: string;
  width: number;
  height: number;
  sizeBytes: number;
}

/** FileReader -> data URL, scaled so the long side is at most `maxSide`. */
export async function readImageFile(file: File, maxSide = 1600): Promise<ReadImage> {
  const problem = checkImageFile(file);
  if (problem) throw new Error(problem);
  const original = await readAsDataUrl(file);
  const img = await loadImage(original);
  const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
  if (scale === 1 && file.size < 600 * 1024) return { dataUrl: original, width: img.naturalWidth, height: img.naturalHeight, sizeBytes: file.size };

  const w = Math.round(img.naturalWidth * scale);
  const h = Math.round(img.naturalHeight * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return { dataUrl: original, width: img.naturalWidth, height: img.naturalHeight, sizeBytes: file.size };
  ctx.drawImage(img, 0, 0, w, h);
  const dataUrl = canvas.toDataURL(file.type === "image/jpeg" ? "image/jpeg" : "image/webp", 0.85);
  return { dataUrl, width: w, height: h, sizeBytes: Math.round((dataUrl.length - dataUrl.indexOf(",") - 1) * 0.75) };
}
