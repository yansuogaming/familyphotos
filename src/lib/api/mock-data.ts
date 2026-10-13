import type {
  AiAccount,
  Album,
  Device,
  StorageUsage,
  UserSettings,
  Conversation,
  LearningArea,
  LearningToday,
  Message,
  Photo,
  TopicDetail,
  User,
} from "./types";

// Demo family. Fictional names; replace with real data from the backend.
export const me: User = {
  id: "u-bao",
  name: "Gia Bảo",
  nickname: "Bảo",
  role: "member",
  grade: 9,
  email: "demo@familyphotos.vn",
  phone: "0912 486 731",
  birthday: "2011-04-18",
};

const admin: User = { id: "u-quan", name: "Bố Minh Quân", nickname: "Bố", role: "admin", email: "admin@familyphotos.vn", phone: "0903 215 664" };

const guest: User = { id: "u-co", name: "Cô Lan", nickname: "Cô Lan", role: "guest", email: "khach@familyphotos.vn" };

/** Demo logins for mock mode. Credentials are listed in DEMO_ACCOUNTS.txt, never shown in the UI. */
export const demoAccounts = [
  { label: "Người trong nhà", identifier: "demo@familyphotos.vn", password: "nhaminh2026", user: me },
  { label: "Khách", identifier: "khach@familyphotos.vn", password: "khach2026", user: guest },
  { label: "Quản trị", identifier: "admin@familyphotos.vn", password: "quantri2026", user: admin },
];

export const settings: UserSettings = {
  theme: "system",
  language: "vi",
  privacy: { discoverableByEmail: false, allowMessagesFromNonContacts: false },
  notifications: { enabled: false, messages: true, calls: true, newPhotos: true, studyReminder: false },
};

export const storage: StorageUsage = {
  usedBytes: 1_384_120_320,
  quotaBytes: 2 * 1024 ** 3,
  breakdown: { photos: 1_012_400_000, videos: 318_700_000, files: 53_020_320 },
};

export const devices: Device[] = [
  { id: "d1", name: "Chrome trên Windows", kind: "desktop", lastActiveAt: "2026-10-13T10:21:00", location: "Hà Nội, Việt Nam", current: true },
  { id: "d2", name: "Family Photos trên iPhone", kind: "phone", lastActiveAt: "2026-10-13T07:02:00", location: "Hà Nội, Việt Nam", current: false },
  { id: "d3", name: "Safari trên iPad", kind: "tablet", lastActiveAt: "2026-09-28T21:40:00", location: "Nam Định, Việt Nam", current: false },
];

export const aiAccounts: AiAccount[] = [
  { provider: "claude", connected: true, label: "demo@familyphotos.vn" },
  { provider: "openai", connected: false },
];

export const family: User[] = [
  me,
  { id: "u-ha", name: "Mẹ Thu Hà", role: "member" },
  admin,
  { id: "u-na", name: "Khánh Na", role: "member", grade: 5 },
  { id: "u-ba", name: "Bà nội", role: "member" },
  guest,
];

export const userById = (id: string) => family.find((u) => u.id === id);

const pic = (seed: string, w: number, h: number) =>
  `https://picsum.photos/seed/fp-${seed}/${w}/${h}`;

export const albums: Album[] = [
  { id: "tet-2026", title: "Tết Bính Ngọ", coverUrl: pic("tet-family", 600, 760), photoCount: 214, takenFrom: "2026-02-14", takenTo: "2026-02-22" },
  { id: "da-lat", title: "Hè ở Đà Lạt", coverUrl: pic("dalat", 600, 760), photoCount: 97, takenFrom: "2026-06-28", takenTo: "2026-07-03" },
  { id: "sinh-nhat-na", title: "Na tròn 10 tuổi", coverUrl: pic("birthday", 600, 760), photoCount: 63, takenFrom: "2026-08-09", takenTo: "2026-08-09" },
  { id: "khai-giang", title: "Ngày khai giảng", coverUrl: pic("school", 600, 760), photoCount: 38, takenFrom: "2026-09-05", takenTo: "2026-09-05" },
  { id: "que-noi", title: "Về quê nội", coverUrl: pic("village", 600, 760), photoCount: 152, takenFrom: "2025-12-27", takenTo: "2026-01-02" },
];

export const photos: Photo[] = [
  { id: "p1", albumId: "tet-2026", url: pic("p1", 800, 600), width: 800, height: 600, takenAt: "2026-02-17", memo: "Mùng 1, cả nhà ở sân", uploadedBy: { id: "u-ha", name: "Mẹ Thu Hà" } },
  { id: "p2", albumId: "tet-2026", url: pic("p2", 600, 800), width: 600, height: 800, takenAt: "2026-02-17", memo: "Bà lì xì Na", uploadedBy: { id: "u-quan", name: "Bố Minh Quân" } },
  { id: "p3", albumId: "da-lat", url: pic("p3", 800, 600), width: 800, height: 600, takenAt: "2026-06-29", memo: "Hồ Tuyền Lâm, 6 giờ sáng", uploadedBy: { id: "u-bao", name: "Gia Bảo" } },
  { id: "p4", albumId: "da-lat", url: pic("p4", 800, 600), width: 800, height: 600, takenAt: "2026-06-30", memo: "Chợ đêm, lạnh run", uploadedBy: { id: "u-ha", name: "Mẹ Thu Hà" } },
  { id: "p5", albumId: "sinh-nhat-na", url: pic("p5", 600, 800), width: 600, height: 800, takenAt: "2026-08-09", memo: "Bánh kem dâu", uploadedBy: { id: "u-ha", name: "Mẹ Thu Hà" } },
  { id: "p6", albumId: "khai-giang", url: pic("p6", 800, 600), width: 800, height: 600, takenAt: "2026-09-05", memo: "Na vào lớp 5", uploadedBy: { id: "u-quan", name: "Bố Minh Quân" } },
  { id: "p7", albumId: "que-noi", url: pic("p7", 800, 600), width: 800, height: 600, takenAt: "2025-12-28", memo: "Cánh đồng sau nhà bà", uploadedBy: { id: "u-bao", name: "Gia Bảo" } },
  { id: "p8", albumId: "que-noi", url: pic("p8", 600, 800), width: 600, height: 800, takenAt: "2025-12-29", memo: "Ông bà và con mèo Mướp", uploadedBy: { id: "u-ha", name: "Mẹ Thu Hà" } },
];

export const conversations: Conversation[] = [
  { id: "c-nha", title: "Nhà mình", kind: "group", memberIds: ["u-bao", "u-ha", "u-quan", "u-na", "u-ba"], unread: 3, lastMessage: { text: "Tối nay ăn lẩu nhé cả nhà", sentAt: "2026-10-13T18:42:00", senderId: "u-ha" } },
  { id: "c-me", title: "Mẹ Thu Hà", kind: "direct", memberIds: ["u-bao", "u-ha"], unread: 0, lastMessage: { text: "Con nhớ mang áo khoác", sentAt: "2026-10-13T07:10:00", senderId: "u-ha" } },
  { id: "c-na", title: "Khánh Na", kind: "direct", memberIds: ["u-bao", "u-na"], unread: 1, lastMessage: { text: "Anh ơi giảng em bài phân số với", sentAt: "2026-10-12T20:05:00", senderId: "u-na" } },
  { id: "c-ba", title: "Bà nội", kind: "direct", memberIds: ["u-bao", "u-ba"], unread: 0, lastMessage: { text: "Ảnh đẹp quá cháu ạ", sentAt: "2026-10-10T09:30:00", senderId: "u-ba" } },
];

export const messages: Message[] = [
  { id: "m1", conversationId: "c-nha", senderId: "u-quan", text: "Cuối tuần này về quê nội nhé, bà nhắc mãi.", sentAt: "2026-10-13T17:58:00" },
  { id: "m2", conversationId: "c-nha", senderId: "u-ba", text: "Ừ, bà làm bánh chưng sẵn rồi.", sentAt: "2026-10-13T18:03:00" },
  { id: "m3", conversationId: "c-nha", senderId: "u-na", attachments: [{ kind: "image", url: pic("chat-cat", 640, 480), width: 640, height: 480 }], text: "Con Mướp lớn chưa bà?", sentAt: "2026-10-13T18:20:00" },
  { id: "m4", conversationId: "c-nha", senderId: "u-bao", text: "Con học xong bài Toán rồi về luôn.", sentAt: "2026-10-13T18:31:00" },
  { id: "m5", conversationId: "c-nha", senderId: "u-ha", text: "Tối nay ăn lẩu nhé cả nhà", sentAt: "2026-10-13T18:42:00" },
];

export const learningToday: LearningToday = {
  goal: 10,
  done: 4,
  streakDays: 12,
  resume: { grade: 9, subject: "Toán", topicIndex: 1, topicTitle: "Phương trình và hệ hai phương trình bậc nhất hai ẩn" },
};

export const learningAreas: LearningArea[] = [
  { id: "toan", title: "Toán", description: "Luyện từng dạng bài, có lời giải từng bước", itemCount: 1284, href: "/hoc/toan" },
  { id: "cac-mon", title: "Các môn học", description: "Lý thuyết theo chủ đề, lớp 1 đến lớp 12", itemCount: 312, href: "/hoc/ly-thuyet" },
  { id: "de-thi", title: "Đề thi", description: "Đề kiểm tra giữa kỳ, cuối kỳ và vào lớp 10", itemCount: 476, href: "/hoc/de-thi" },
  { id: "sach", title: "Sách", description: "Sách giáo khoa và sách đọc thêm", itemCount: 89, href: "/hoc/sach" },
];

export const subjectsByGrade: Record<number, string[]> = {
  5: ["Tiếng Việt", "Toán", "Tiếng Anh", "Đạo đức", "Khoa học", "Lịch sử và Địa lí", "Tin học", "Công nghệ", "Âm nhạc", "Mĩ thuật"],
};

export const topics = [
  "Đọc hiểu văn bản văn học",
  "Đọc hiểu văn bản thông tin",
  "Từ đồng nghĩa, từ đa nghĩa",
  "Đại từ",
  "Kết từ",
  "Câu đơn và câu ghép",
  "Liên kết câu trong đoạn văn",
  "Dấu gạch ngang, dấu ngoặc kép, dấu ngoặc đơn",
  "Viết bài văn tả phong cảnh",
  "Viết bài văn kể chuyện sáng tạo",
  "Viết bài văn tả người",
  "Viết đoạn văn nêu ý kiến",
].map((title, i) => ({ index: i + 1, title }));

export const topicDetail: TopicDetail = {
  index: 1,
  title: "Đọc hiểu văn bản văn học",
  grade: 5,
  subject: "Tiếng Việt",
  outcomes: ["Con đọc một câu chuyện hoặc bài thơ rồi nói được nhân vật, nội dung và ý nghĩa của bài."],
  sgkLessons: [
    "Bài 3. Bài đọc truyện về tình cảm gia đình, tình bạn (chủ điểm Thế giới tuổi thơ)",
    "Bài 4. Bài đọc truyện, thơ về thiên nhiên và con người (chủ điểm Thiên nhiên kì thú)",
    "Bài 5. Bài đọc về những tấm gương lao động, học tập (chủ điểm Trên con đường học tập)",
  ],
  notes: [
    { title: "Bài 1. Thanh âm của gió", keyPoint: "Truyện kể trò chơi bịt tai nghe gió của các bạn nhỏ bên bờ suối, qua đó thấy thế giới quanh mình trở nên mới lạ, thú vị. Đọc truyện, con tìm nhân vật, việc làm và điều các bạn nhận ra." },
    { title: "Bài 2. Sắc màu em yêu", keyPoint: "Bài thơ gọi tên từng màu sắc gắn với cảnh vật quen thuộc của quê hương. Con chú ý mỗi màu gợi ra hình ảnh nào và tình cảm của bạn nhỏ với đất nước." },
  ],
};

export const assistantSuggestions = [
  "Giải thích cho con lớp 5 vì sao bầu trời màu xanh",
  "Dịch sang tiếng Anh: Cả nhà đi Đà Lạt",
  "Lên kế hoạch học tuần này",
  "Gửi ảnh trong chat thế nào?",
];
