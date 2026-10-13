"use client";

import { Sparkle } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

const examples = [
  {
    q: "Giải thích cho con lớp 5 vì sao bầu trời màu xanh",
    a: "Ánh sáng Mặt Trời có đủ bảy màu. Khi đi qua không khí, màu xanh bị các hạt khí nhỏ xíu hắt đi khắp nơi nhiều nhất, nên nhìn đâu con cũng thấy màu xanh.",
  },
  {
    q: "Lên kế hoạch học tuần này cho Na",
    a: "Thứ Hai và Thứ Tư: 15 phút phân số. Thứ Ba: đọc bài Thanh âm của gió. Thứ Năm: viết đoạn văn tả cảnh. Cuối tuần: ôn lại các câu làm sai.",
  },
  {
    q: "Tìm ảnh Tết năm nay có bà nội",
    a: "Mình thấy 38 ảnh trong album Tết Bính Ngọ có bà nội. Ảnh được thả tim nhiều nhất là “Bà lì xì Na” chụp sáng mùng 1.",
  },
];

export function AiDemo() {
  const [active, setActive] = useState(0);
  return (
    <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
      <div className="flex flex-col gap-2 lg:col-span-5" role="tablist" aria-label="Câu hỏi mẫu">
        {examples.map((e, i) => (
          <button
            key={e.q}
            role="tab"
            aria-selected={active === i}
            onClick={() => setActive(i)}
            className={`rounded-[var(--radius-paper)] border px-4 py-3.5 text-left text-[0.95rem] transition-colors ${
              active === i ? "border-coral bg-coral-wash font-semibold text-ink" : "border-line text-ink-2 hover:border-ink-3 hover:text-ink"
            }`}
          >
            {e.q}
          </button>
        ))}
      </div>
      <div className="relative min-h-56 rounded-[var(--radius-paper)] border border-line bg-paper p-6 paper-shadow lg:col-span-7 lg:p-8" role="tabpanel">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-coral-ink">
          <Sparkle size={18} weight="fill" /> Trợ lý AI
        </div>
        <AnimatePresence mode="wait">
          <motion.p
            key={active}
            initial={{ opacity: 0, filter: "blur(4px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-[60ch] text-lg leading-relaxed text-ink"
          >
            {examples[active].a}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}
