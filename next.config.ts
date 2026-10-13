import type { NextConfig } from "next";

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
      ["/hoc/toan", "/learn/math"],
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
    // Demo photos. Replace with the backend's media host.
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
    ],
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
