# API Chat riêng (đính kèm, cảm xúc, trả lời, nhóm, gọi video)

Frontend gọi qua `src/lib/api/chat-ext.ts` (`chatExtApi`). Kiểu dữ liệu: `src/lib/api/chat-ext-types.ts`, dựa trên `Conversation`, `Message`, `Attachment` trong `src/lib/api/types.ts`. Mock: `src/lib/api/chat-ext-mock.ts`.

Quy ước chung giống `API_CONTRACT.md`.

## Kiểu mở rộng

- `ChatConversation = Conversation & { muted?: boolean }`
- `ChatMessage = Message & { replyTo?: ReplyRef, reactions?: Reaction[], seenBy?: string[] }`
- `ReplyRef { id, senderId, text?, kind? }`: bản tóm tắt tin được trả lời, để hiện trích dẫn mà không cần tải lại tin gốc.
- `Reaction { emoji, userIds }`: mỗi người thả một lần cho mỗi emoji.
- `Attachment` giữ nguyên: `image { url, width, height }`, `file { name, size, url }`, `location { lat, lng, label }`.

## Cuộc trò chuyện

| Method | Path | Body | Trả về |
|---|---|---|---|
| GET | `/conversations` | | `ChatConversation[]`, có tin mới nhất trước |
| POST | `/conversations` | `{ kind: "group", title, memberIds }` | `ChatConversation` (người tạo tự có trong `memberIds`) |
| POST | `/conversations` | `{ kind: "direct", memberIds: [userId] }` | `ChatConversation`: có sẵn thì trả cái cũ |
| PUT / DELETE | `/conversations/:id/mute` | | `204`: tắt / bật lại thông báo |
| DELETE | `/conversations/:id/members/me` | | `204`: rời nhóm |
| GET | `/conversations/:id/attachments` | | `ConversationMedia { images[], files[] }`, mới trước, mỗi mục kèm `messageId, senderId, sentAt` |
| GET | `/contacts` | | `Contact[] { id, name, role, nickname?, avatarUrl?, online, lastSeenAt? }`: người trong nhà, không gồm chính mình |

## Tin nhắn

| Method | Path | Body | Trả về |
|---|---|---|---|
| GET | `/conversations/:id/messages` | | `ChatMessage[]` (cũ đến mới) |
| POST | `/conversations/:id/messages` | JSON `{ text?, replyToId?, location? }` | `ChatMessage` |
| POST | `/conversations/:id/messages` | multipart: `text?`, `replyToId?`, `files` (nhiều tệp) | `ChatMessage`. Ảnh thành `image`, tệp khác thành `file` |
| POST | `/messages/:id/reactions` | `{ emoji }` | `Reaction[]` mới của tin. Gọi lại cùng emoji là bỏ |
| POST | `/conversations/:id/typing` | | `204`. Frontend gọi tối đa 3 giây một lần khi đang gõ |
| POST | `/conversations/:id/seen` | `{ messageId }` | `204`: đã đọc tới tin này |

Giới hạn đính kèm phía frontend: tối đa 10 tệp mỗi lần, mỗi tệp 25 MB.

## Realtime (WebSocket)

Frontend mở `ws(s)://<NEXT_PUBLIC_API_URL>/realtime` (cookie phiên), nhận các sự kiện JSON `ChatEvent`:

| `type` | Trường | Ý nghĩa |
|---|---|---|
| `message` | `message: ChatMessage` | Tin mới (kể cả của người khác trong nhóm) |
| `typing` | `conversationId, userId, typing` | Bắt đầu / thôi gõ. Backend tự gửi `typing: false` sau 5 giây không có tín hiệu |
| `seen` | `conversationId, userId, messageId` | Ai đó đã đọc tới tin |
| `reaction` | `messageId, reactions` | Cảm xúc của một tin thay đổi |

Mock mô phỏng: sau khi bạn gửi, người kia "đã xem", "đang gõ" rồi trả lời một câu ngắn.

## Gọi video

| Method | Path | Body | Trả về |
|---|---|---|---|
| POST | `/conversations/:id/calls` | `{ video: true }` | `CallSession { id, conversationId, iceServers }` |
| DELETE | `/calls/:id` | | `204`: kết thúc |

Tín hiệu WebRTC (offer, answer, ICE) sẽ đi qua cùng kết nối `/realtime`, định dạng bàn khi làm thật. Hiện màn gọi chỉ bật camera của mình và giả lập phía bên kia.
