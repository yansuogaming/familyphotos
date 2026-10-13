// Default copy and images of the public pages, used until the backend returns its own.
import type { SiteContent } from "./site-types";

const album = (seed: string) => `https://picsum.photos/seed/fp-${seed}/800/600`;
const cover = (seed: string) => `https://picsum.photos/seed/fp-${seed}/600/450`;

/** Exactly the copy and photos the public pages shipped with. */
export const defaultSite: SiteContent = {
  landing: {
    heroTitle: "Nhà mình, cất trong một cuốn sổ.",
    heroHighlight: "một cuốn sổ",
    heroLead: "Ảnh, tin nhắn, bài học của các con và trợ lý AI. Chỉ người trong nhà mới mở được.",
    album: [
      { url: album("p1"), alt: "Ảnh minh hoạ: Mùng 1, cả nhà ở sân", memo: "Mùng 1, cả nhà ở sân", date: "17.02" },
      { url: album("p2"), alt: "Ảnh minh hoạ: Bà lì xì Na", memo: "Bà lì xì Na", date: "17.02" },
      { url: album("p3"), alt: "Ảnh minh hoạ: Hồ Tuyền Lâm, 6 giờ sáng", memo: "Hồ Tuyền Lâm, 6 giờ sáng", date: "29.06" },
      { url: album("p5"), alt: "Ảnh minh hoạ: Na tròn 10 tuổi", memo: "Na tròn 10 tuổi", date: "09.08" },
    ],
    photos: {
      title: "Mỗi dịp một cuốn album.",
      body: "Tết, sinh nhật, chuyến đi chơi. Ai trong nhà cũng thêm ảnh được, kèm một dòng ghi chú như viết tay sau tấm ảnh.",
    },
    shelf: [
      { title: "Tết ở nhà bà", image: { url: "https://picsum.photos/seed/fp-show-tet/600/760", alt: "" } },
      { title: "Hè đi biển", image: { url: "https://picsum.photos/seed/fp-show-bien/600/760", alt: "" } },
      { title: "Sinh nhật con", image: { url: "https://picsum.photos/seed/fp-show-sinhnhat/600/760", alt: "" } },
      { title: "Ngày khai giảng", image: { url: "https://picsum.photos/seed/fp-show-truong/600/760", alt: "" } },
      { title: "Về quê", image: { url: "https://picsum.photos/seed/fp-show-que/600/760", alt: "" } },
    ],
    chat: {
      title: "Chuyện nhà, nói trong nhà.",
      body: "Nhóm cả nhà hoặc nhắn riêng. Gửi ảnh, tệp, vị trí và gọi video, không có người lạ, không có quảng cáo.",
    },
    learn: {
      title: "Góc học của các con.",
      body: "Theo chương trình lớp 1 đến lớp 12. Mỗi ngày mười câu, làm đúng được cô chấm đỏ.",
    },
    assistant: {
      title: "Hỏi gì cũng được, ở góc nào cũng có.",
      body: "Nút trợ lý nằm sẵn ở góc phải mọi trang. Giảng bài cho con, dịch một câu, hay tìm lại tấm ảnh cũ.",
    },
    privacy: {
      statement: "Không bảng tin, không người lạ. Cửa chỉ mở cho người nhà mình cho phép.",
      points: [
        { title: "Khách có giới hạn", body: "Họ hàng vào bằng tài khoản khách, chỉ thấy album được chia sẻ." },
        { title: "Đăng nhập bằng điện thoại", body: "Quét mã QR, người trong nhà xác nhận trên máy của mình." },
        { title: "Ảnh của nhà mình", body: "Không dùng để quảng cáo. Tải về toàn bộ bất cứ lúc nào." },
      ],
    },
    closing: "Cả nhà đang đợi trong kia.",
  },
  login: {
    coverPhotos: [
      { url: cover("p8"), alt: "" },
      { url: cover("p3"), alt: "" },
      { url: cover("p6"), alt: "" },
    ],
    coverLine: "Cửa nhà chỉ mở cho người nhà mình.",
    greetingTitle: "Vào nhà",
    greeting: "Chào mừng về nhà. Chọn cách mở cửa quen thuộc của bạn.",
  },
  register: {
    coverPhotos: [
      { url: cover("reg-1"), alt: "" },
      { url: cover("reg-2"), alt: "" },
      { url: cover("reg-3"), alt: "" },
    ],
    title: "Bạn là ai?",
    lead: "Người trong nhà thấy mọi thứ. Khách chỉ thấy những album được chia sẻ.",
    member: { title: "Người trong nhà", body: "Bố mẹ, con cái. Cần mã mời từ một người trong nhà." },
    guest: { title: "Đăng ký làm khách", body: "Họ hàng, bạn bè. Người nhà duyệt rồi mới vào được." },
    sentTitle: "Kiểm tra email của bạn",
    sentBody: "Nhà vừa gửi một mã gồm 6 số để xác nhận email.",
  },
};

