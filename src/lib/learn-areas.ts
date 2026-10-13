// The learning area's table of contents. Fixed UI navigation; item counts come from the API.
export const learnAreas = [
  { id: "cac-mon", title: "Các môn học", description: "Lý thuyết theo chủ đề, lớp 1 đến lớp 12", href: "/learn/theory" },
  { id: "de-thi", title: "Đề thi", description: "Đề kiểm tra giữa kỳ, cuối kỳ và vào lớp 10", href: "/learn/exams" },
  { id: "sach", title: "Sách", description: "Sách giáo khoa và sách đọc thêm", href: "/learn/books" },
] as const;
