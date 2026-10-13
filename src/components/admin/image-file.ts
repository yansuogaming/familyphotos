// Checks on image files picked by the admin before they are uploaded.

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const IMAGE_ACCEPT = IMAGE_TYPES.join(",");

/** Returns a message for the admin when the file can't be used, else null. */
export function checkImageFile(file: File): string | null {
  if (!IMAGE_TYPES.includes(file.type)) return `"${file.name}" không phải ảnh JPG, PNG hay WebP.`;
  if (file.size > MAX_IMAGE_BYTES) return `"${file.name}" nặng hơn 5 MB. Hãy chọn ảnh nhỏ hơn.`;
  return null;
}

/** Throws the message from `checkImageFile` so callers can show it. */
export function assertImageFile(file: File): void {
  const problem = checkImageFile(file);
  if (problem) throw new Error(problem);
}
