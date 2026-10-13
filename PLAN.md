# Kế hoạch giao diện mới Family Photos

## 1. Hướng thiết kế: "Sổ nhà"

Gộp hai cuốn sổ quen thuộc nhất trong nhà người Việt: **album ảnh bìa nhựa** và **vở ô li của con**.

| | Chế độ tối | Chế độ sáng |
|---|---|---|
| Ý tưởng | Bìa album xanh than lúc buổi tối | Trang vở trắng, có ô li mờ (cố ý không dùng màu kem) |
| Màu nền | Xanh than (OKLCH), không dùng màu đen tuyền | Trắng hơi ngả xanh tím |
| Điểm nhấn | Cam san hô (giữ theo thương hiệu): nút chính, dấu tích đỏ kiểu cô chấm bài, dải ruy băng đánh dấu "đang ở đây / đang học dở" | |

- **Font**: Bricolage Grotesque (tiêu đề), Be Vietnam Pro (nội dung), Patrick Hand (chỉ dùng cho dòng ghi chú viết tay dưới ảnh). Cả ba đều có đủ dấu tiếng Việt.
- **Icon**: Phosphor, một bộ duy nhất. **Hiệu ứng chuyển động**: thư viện Motion; tự tắt khi người dùng bật "giảm chuyển động" (reduce motion).
- **Đặc trưng riêng**: ảnh nằm trong túi nhựa có dòng ghi chú; ruy băng cam đánh dấu phòng đang mở trên thanh menu và bài đang học dở; mục lục kiểu vở (có dòng chấm dẫn) thay cho 4 thẻ giống nhau.
- **Tuân theo hai bộ skill**: không dùng Inter, không gradient tím, không xếp 3 thẻ ngang bằng nhau, không có nhãn nhỏ phía trên tiêu đề (eyebrow), không dùng em-dash, nút không bị xuống dòng, chữ đạt tương phản WCAG AA, đủ các trạng thái loading/rỗng/lỗi.

Hai bộ skill đã được cài vào project (`.claude/skills/impeccable`, `.agents/skills/design-taste-frontend`). Hook của impeccable tự quét lỗi thiết kế mỗi lần sửa file giao diện. Bối cảnh sản phẩm nằm trong [PRODUCT.md](PRODUCT.md), quyết định hướng thiết kế nằm trong `.impeccable/surfaces/`.

## 2. Bản demo hiện có (giai đoạn 0)

| Route | Nội dung | Trạng thái |
|---|---|---|
| `/` | Landing: album mở + QR đăng nhập ngay tại trang, các mục Ảnh, Chat, Học, Trợ lý AI, Riêng tư | Xong |
| `/dang-nhap` | Tab Mã QR (đếm ngược 60 giây, đã quét, hết hạn, lỗi) và tab Mật khẩu (kiểm tra ô nhập, báo lỗi) | Xong |
| `/dang-ky` | "Bạn là ai?": Người trong nhà (cần mã mời) / Khách (chờ người nhà duyệt) | Xong |
| `/anh` | Kệ album + ảnh mới thêm (dạng masonry), có loading/rỗng/lỗi | Demo |
| `/chat` | Danh sách cuộc trò chuyện + khung chat + ô soạn tin (ảnh, tệp, vị trí, biểu cảm), gọi video | Demo |
| `/hoc` | 10 ô mục tiêu hằng ngày, chuỗi ngày học, phần "đang học dở", mục lục | Demo |
| `/hoc/ly-thuyet` | Chọn lớp 1-12, chọn môn, mục lục chủ đề, bài học có lề đỏ, phần "Trong bài này" | Demo |
| `/tro-ly` + nút nổi | Trợ lý AI toàn trang và khung trượt ra từ nút nổi ở góc phải mọi trang | Demo |
| `/cai-dat` | Hồ sơ dạng "nhãn vở" (sửa thông tin, đổi ảnh đại diện), bảo mật (đổi mật khẩu, đăng nhập bằng QR, thiết bị), tài khoản AI riêng, dung lượng, riêng tư, giao diện, thông báo, xoá tài khoản | Xong |
| Menu avatar | Hiện ở thanh trên cùng sau khi đăng nhập: sửa thông tin, cài đặt, đăng nhập máy khác, đăng xuất | Xong |

**Tài khoản demo**: xem file `DEMO_ACCOUNTS.txt` (không hiển thị trên giao diện, không commit lên git).

Các trang trong app đều yêu cầu đăng nhập. Chưa đăng nhập thì tự chuyển về `/dang-nhap`.

Chạy: `npm run dev` rồi mở http://localhost:3000. Dữ liệu là mock (tên gia đình hư cấu, ảnh từ picsum).

## 3. Các giai đoạn làm tiếp (khi bạn duyệt)

1. **Hoàn thiện nền tảng**: thêm DESIGN.md (impeccable document), i18n VI/EN (next-intl), modal QR "đăng nhập máy khác", trang 404/lỗi, favicon theo logo.
2. **Ảnh**: trang chi tiết album, xem ảnh toàn màn hình (vuốt, phím mũi tên), tải ảnh lên bằng kéo thả kèm tiến trình, sửa ghi chú, chia sẻ album cho khách.
3. **Chat**: gửi ảnh/tệp/vị trí thật, bảng chọn emoji, tạo nhóm, tìm trong cuộc trò chuyện, giao diện gọi video, trạng thái đã xem / đang gõ.
4. **Học**: luyện tập (câu hỏi, chấm đúng sai bằng dấu đỏ), ôn câu sai, Toán, Đề thi, Sách, tìm kiếm lý thuyết.
5. **Trợ lý AI**: trả lời dạng stream, lịch sử hội thoại, đính kèm ảnh, giọng nói, "Hỏi AI về chủ đề này" mang theo ngữ cảnh bài học.
6. **Chất lượng**: impeccable audit + polish, kiểm thử bàn phím và trình đọc màn hình, đo Lighthouse, cài TanStack Query thay cho `useApi`.

## 4. Chia việc với backend

- Frontend chỉ lấy dữ liệu qua `src/lib/api/client.ts`. Kiểu dữ liệu nằm ở `src/lib/api/types.ts`.
- Khi đặt biến `NEXT_PUBLIC_API_URL`, client gọi backend thật. Nếu không đặt, client dùng mock.
- Người làm backend chỉ cần làm đúng [API_CONTRACT.md](API_CONTRACT.md), không phải sửa giao diện.
