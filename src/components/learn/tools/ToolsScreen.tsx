"use client";

import { ArrowLeft, ArrowRight } from "@phosphor-icons/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { LearnHeader } from "@/components/learn/practice/shared";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { Calculator } from "./Calculator";
import { EquationSolver } from "./EquationSolver";
import { FormulaTable } from "./FormulaTable";
import { mmss, Pomodoro, usePomodoro, type PomodoroState } from "./Pomodoro";
import { UnitConverter } from "./UnitConverter";

const tools = [
  { id: "may-tinh", title: "Máy tính", desc: "Cộng trừ nhân chia, căn, luỹ thừa, sin cos tan." },
  { id: "giai-phuong-trinh", title: "Giải phương trình", desc: "Bậc nhất, bậc hai và hệ hai ẩn, có lời giải từng bước." },
  { id: "cong-thuc", title: "Bảng công thức", desc: "Toán, Vật lí, Hoá học từ lớp 6 đến lớp 12." },
  { id: "dong-ho", title: "Đồng hồ học", desc: "Học 25 phút, nghỉ 5 phút. Hết giờ có chuông báo." },
  { id: "doi-don-vi", title: "Đổi đơn vị", desc: "Độ dài, khối lượng, diện tích, thời gian, nhiệt độ." },
] as const;
type ToolId = (typeof tools)[number]["id"];

/** /hoc/tien-ich. `?cu=<toolId>` picks the tool. On phones the list and the tool are separate screens. */
export function ToolsScreen() {
  const param = useSearchParams().get("cu");
  const wide = useMediaQuery("(min-width: 1024px)");
  const pomodoro = usePomodoro();
  const picked = tools.find((t) => t.id === param)?.id;
  const active: ToolId | undefined = picked ?? (wide ? "may-tinh" : undefined);
  const tool = tools.find((t) => t.id === active);

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 lg:py-8">
      <LearnHeader title="Tiện ích học tập" modes />

      <div className="mt-8 lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-12">
        <nav aria-label="Các công cụ" className={active && !wide ? "hidden" : ""}>
          <ol className="lg:sticky lg:top-24">
            {tools.map((t) => {
              const on = t.id === active;
              const timer = t.id === "dong-ho" && (pomodoro.running || pomodoro.left !== pomodoro.total);
              return (
                <li key={t.id} className="border-b border-line lg:border-0">
                  <Link
                    href={`/hoc/tien-ich?cu=${t.id}`}
                    scroll={false}
                    aria-current={on ? "page" : undefined}
                    className={`group relative flex items-start gap-3 py-4 pl-6 pr-2 transition-colors lg:py-3 ${on ? "text-ink" : "text-ink-2 hover:text-ink"}`}
                  >
                    <span
                      aria-hidden="true"
                      className={`absolute left-0 top-3 h-7 w-3 bg-coral transition-[opacity,transform] duration-300 ease-[var(--ease-out-expo)] [clip-path:polygon(0_0,100%_0,100%_100%,50%_75%,0_100%)] lg:top-2.5 ${
                        on ? "opacity-100" : "-translate-x-1 opacity-0"
                      }`}
                    />
                    <span className="min-w-0 flex-1">
                      <span className={`flex items-center gap-2 text-[1.05rem] ${on ? "font-semibold" : "font-medium"}`}>
                        {t.title}
                        {timer && (
                          <span className="tabular rounded-full bg-coral-wash px-2 text-xs font-semibold text-coral-ink">
                            {mmss(pomodoro.left)}
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 block text-sm text-ink-3 lg:hidden">{t.desc}</span>
                    </span>
                    <ArrowRight size={18} className="mt-1 shrink-0 text-ink-3 lg:hidden" aria-hidden="true" />
                  </Link>
                </li>
              );
            })}
          </ol>
        </nav>

        {tool && (
          <section aria-labelledby="cong-cu" className="min-w-0">
            {!wide && (
              <Link href="/hoc/tien-ich" scroll={false} className="mb-4 inline-flex h-10 items-center gap-1.5 rounded-full pl-2 pr-4 text-sm font-semibold text-ink-2 hover:bg-paper-2 hover:text-ink">
                <ArrowLeft size={18} /> Tất cả công cụ
              </Link>
            )}
            <h2 id="cong-cu" className="text-2xl font-bold">
              {tool.title}
            </h2>
            <p className="mt-1 text-ink-2">{tool.desc}</p>
            <div className="mt-6">
              <ToolBody id={tool.id} pomodoro={pomodoro} />
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function ToolBody({ id, pomodoro }: { id: ToolId; pomodoro: PomodoroState }): ReactNode {
  switch (id) {
    case "may-tinh":
      return <Calculator />;
    case "giai-phuong-trinh":
      return <EquationSolver />;
    case "cong-thuc":
      return <FormulaTable />;
    case "dong-ho":
      return <Pomodoro p={pomodoro} />;
    case "doi-don-vi":
      return <UnitConverter />;
  }
}
