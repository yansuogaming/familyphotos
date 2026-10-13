// Small formatting helpers for the media library.

/** "96 KB" for small images, "1,4 MB" above that. */
export function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${Math.max(1, Math.round(bytes / 1024)).toLocaleString("vi-VN")} KB`;
  return `${(bytes / 1024 ** 2).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} MB`;
}

/** Splits "mung-1.jpg" into ["mung-1", ".jpg"]. */
export function splitName(name: string): [string, string] {
  const m = name.match(/^(.*?)(\.[a-z0-9]{2,5})$/i);
  return m ? [m[1], m[2]] : [name, ""];
}
