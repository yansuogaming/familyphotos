# API AI: khoá chung của nhà và khoá riêng của khách

Frontend: `src/lib/api/ai.ts`, kiểu dữ liệu trong `ai-types.ts`.

## Ai dùng khoá nào

| Người dùng | Khoá dùng |
|---|---|
| Quản trị, người trong nhà | Khoá chung của nhà (admin cấu hình) |
| Khách có khoá riêng | Khoá riêng của khách |
| Khách chưa có khoá riêng | Khoá chung, nhưng chỉ khi admin bật `guestsUseSharedKey`. Nếu không thì không dùng được trợ lý |
| Khách, khi `guestsAllowed = false` | Không dùng được trợ lý |

## Bảo mật khoá

- **Lưu khoá:** API key chỉ đi một chiều, từ frontend lên. Backend lưu mã hoá và **không bao giờ trả lại khoá đầy đủ**, chỉ trả `keyHint` gồm 4 ký tự cuối (ví dụ `....4f2c`).
- **Giữ nguyên khoá cũ:** khi `PUT` mà không gửi `apiKey`, backend giữ nguyên khoá đã lưu.
- **Gọi nhà cung cấp AI:** chỉ backend gọi, frontend không gọi trực tiếp.
- **Kiểm tra quyền khi trả lời:** `POST /assistant/messages` phải tự kiểm tra quyền theo bảng trên. Không được dùng thì trả `403` kèm lý do.

## Endpoint

| Method | Path | Body | Trả về |
|---|---|---|---|
| GET | `/me/ai` | | `AiAccess` (đang dùng khoá nào, hoặc lý do không dùng được) |
| PUT | `/me/ai` | `AiKeyInput` | `AiKeyConfig`. Chỉ khách được gọi, người trong nhà nhận `403` |
| DELETE | `/me/ai` | | `204` |
| POST | `/me/ai/test` | `AiKeyInput` | `AiTestResult` |
| GET | `/admin/ai/shared` | | `AiKeyConfig` (chỉ admin) |
| PUT | `/admin/ai/shared` | `AiKeyInput` | `AiKeyConfig` |
| POST | `/admin/ai/shared/test` | `AiKeyInput` | `AiTestResult` |

Trường `guestsUseSharedKey` nằm trong `AssistantConfig` (`PUT /admin/assistant`).
