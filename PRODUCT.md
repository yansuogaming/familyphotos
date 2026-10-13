# Product

## Platform

web

## Stack

Next.js (App Router, v16) + TypeScript + Tailwind v4. Frontend only; backend is built separately by another developer against a typed API contract (`src/lib/api`).

## Users

One private family. Parents and children (school grades 1-12) are "người trong nhà" (members). Relatives or friends can register as "khách" (guests) with limited access. Used at home on laptops and phones, often in the evening; kids use it alone for studying.

## Product Purpose

A private home on the web for one family: keep the family's photos, talk privately, help the kids study, and ask an AI assistant. Success means the family uses it instead of scattering photos and conversations across public apps, and the kids open it to study on their own.

## Positioning

It belongs to one family only. Nothing is public, there is no feed and no strangers. The learning area follows the Vietnamese school curriculum (Lớp 1-12, subjects per grade, theory by topic, exams, books).

## Operating Context

- Entry: a landing page that acts as the front door of the family's home, then login or register.
- Login: email/password, or QR (the web shows a QR code, a member who is already signed in on their phone scans it to sign the browser in, like Zalo Web).
- Register: the visitor chooses "Đăng ký làm khách" (guest) or "Người trong nhà" (member).
- Main sections: Ảnh (family photo albums), Chat riêng (private chat, 1-1 and group, with images, files, location, emoji, video call), Học (daily practice goal, streak, Các môn học / Lý thuyết các môn by grade and subject, Đề thi, Sách), Trợ lý AI (full page and a floating button bottom-right on every app screen).
- Settings, light/dark toggle and the user menu (profile, settings, sign-in on another device, logout) live in the top bar.

## Capabilities and Constraints

- Vietnamese only for now. All fonts must cover Vietnamese diacritics.
- Light and dark mode both required.
- Frontend must not hardcode backend behavior: every data call goes through `src/lib/api`, which only talks to the backend at NEXT_PUBLIC_API_URL. No mock data, no demo accounts.
- Undecided: storage limits, roles beyond guest/member, AI provider.

## Brand Commitments

- Name: Family Photos, tagline "Kho ảnh gia đình".
- Logo: the orange house holding a photo. Keep it.
- Coral orange is the brand accent. Keep it.

## Evidence on Hand

Only screenshots of the previous UI. No real family photos, testimonials or user numbers exist; do not fabricate them. The public landing page uses illustrative placeholder images only.

## Product Principles

1. Private by default: every screen should feel like it is inside the family's home, never a public network.
2. Kids can use it alone: labels are plain Vietnamese, targets are large, nothing hides behind jargon.
3. One home, many rooms: photos, chat, learning and AI share one shell and one assistant.
4. Frontend and backend stay decoupled through a written contract.

## Accessibility & Inclusion

Children and grandparents use it: WCAG AA contrast, large touch targets (44px min), readable body size, reduced-motion support.
