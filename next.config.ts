import type { NextConfig } from "next";
import { OPTIMIZED_IMAGE_HOSTS } from "./src/lib/image-hosts";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Old Vietnamese URLs keep working: every route is English now.
  async redirects() {
    const map: [string, string][] = [
      ["/dang-nhap", "/login"],
      ["/dang-ky", "/register"],
      ["/anh", "/photos"],
      ["/anh/:id", "/photos/:id"],
      ["/tro-ly", "/assistant"],
      ["/cai-dat", "/settings"],
      ["/hoc", "/learn"],
      ["/hoc/ly-thuyet", "/learn/theory"],
      ["/hoc/luyen-tap", "/learn/practice"],
      ["/hoc/on-tap", "/learn/review"],
      ["/hoc/giai-bai-tap", "/learn/solutions"],
      ["/hoc/tien-ich", "/learn/tools"],
      ["/hoc/toan", "/learn/theory"],
      ["/learn/math", "/learn/theory"],
      ["/hoc/de-thi", "/learn/exams"],
      ["/hoc/sach", "/learn/books"],
      ["/quan-tri", "/admin"],
      ["/quan-tri/dang-nhap", "/admin"],
      ["/quan-tri/thanh-vien", "/admin/members"],
      ["/quan-tri/album", "/admin/albums"],
      ["/quan-tri/thu-vien", "/admin/library"],
      ["/quan-tri/noi-dung", "/admin/content"],
      ["/quan-tri/hoc-lieu", "/admin/lessons"],
      ["/quan-tri/tro-ly", "/admin/assistant"],
      ["/quan-tri/he-thong", "/admin/system"],
    ];
    return map.map(([source, destination]) => ({ source, destination, permanent: false }));
  },
  images: {
    // Hosts in src/lib/image-hosts.ts. Add the backend's media host there.
    remotePatterns: OPTIMIZED_IMAGE_HOSTS.map((hostname) => ({ protocol: "https" as const, hostname })),
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
