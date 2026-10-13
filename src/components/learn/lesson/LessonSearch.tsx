"use client";

import { BookOpenText, FolderSimple, MagnifyingGlass, MathOperations, TextAlignLeft, X } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useId, useRef, useState } from "react";
import { RichText } from "@/components/learn/Math";
import { type LessonSearchHit, lessonsApi } from "@/lib/api/lessons";

const ease = [0.16, 1, 0.3, 1] as const;

type Kind = "topic" | "lesson" | "formula" | "text";
function kindOf(hit: LessonSearchHit): Kind {
  if (/^Chủ đề \d+\./.test(hit.snippet)) return "topic";
  if (/^Chủ đề \d+, Bài \d+$/.test(hit.snippet)) return "lesson";
  return hit.snippet.includes("$") ? "formula" : "text";
}
const kindIcon = { topic: FolderSimple, lesson: BookOpenText, formula: MathOperations, text: TextAlignLeft };
const kindLabel = { topic: "Chủ đề", lesson: "Bài", formula: "Công thức", text: "Nội dung" };

/** "Tìm chủ đề, công thức" with a results popover. */
export function LessonSearch({ grade, onOpen, className = "" }: { grade: number; onOpen: (hit: LessonSearchHit) => void; className?: string }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [allGrades, setAllGrades] = useState(false);
  const [active, setActive] = useState(0);
  const [result, setResult] = useState<{ key: string; hits: LessonSearchHit[] } | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const reduce = useReducedMotion();
  const uid = useId();

  const term = q.trim();
  const scope = allGrades ? undefined : grade;
  const key = `${term}|${scope ?? "all"}`;
  const status = !term ? "idle" : result?.key === key ? "ready" : "loading";
  const hits = status === "ready" ? result!.hits : [];

  useEffect(() => {
    if (!term) return;
    let alive = true;
    const t = setTimeout(() => {
      lessonsApi.search(term, scope).then(
        (h) => alive && setResult({ key, hits: h }),
        () => alive && setResult({ key, hits: [] }),
      );
    }, 200);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [term, scope, key]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  const choose = (hit: LessonSearchHit) => {
    setOpen(false);
    inputRef.current?.blur();
    onOpen(hit);
  };

  const showPanel = open && !!term;
  const activeIndex = Math.min(active, Math.max(hits.length - 1, 0));

  return (
    <div ref={boxRef} className={`relative ${className}`}>
      <label className="flex h-11 items-center gap-2 rounded-full border border-line bg-paper-2 pl-4 pr-1.5 transition-colors focus-within:border-coral focus-within:bg-paper">
        <MagnifyingGlass size={18} className="shrink-0 text-ink-3" aria-hidden="true" />
        <span className="sr-only">Tìm trong lý thuyết</span>
        <input
          ref={inputRef}
          value={q}
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={`${uid}-list`}
          aria-autocomplete="list"
          aria-activedescendant={showPanel && hits.length ? `${uid}-opt-${activeIndex}` : undefined}
          placeholder="Tìm chủ đề, công thức"
          onChange={(e) => {
            setQ(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              if (showPanel) e.stopPropagation();
              setOpen(false);
            } else if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
              setActive(Math.min(activeIndex + 1, hits.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive(Math.max(activeIndex - 1, 0));
            } else if (e.key === "Enter" && hits[activeIndex]) {
              e.preventDefault();
              choose(hits[activeIndex]);
            }
          }}
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-3"
        />
        {q && (
          <button
            type="button"
            onClick={() => {
              setQ("");
              inputRef.current?.focus();
            }}
            aria-label="Xoá ô tìm"
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-ink-3 hover:bg-paper-3 hover:text-ink"
          >
            <X size={16} />
          </button>
        )}
      </label>

      <AnimatePresence>
        {showPanel && (
          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -4 }}
            transition={{ duration: 0.25, ease }}
            className="absolute right-0 top-full z-40 mt-2 w-[min(30rem,calc(100vw-2rem))] overflow-hidden rounded-[var(--radius-paper)] border border-line bg-paper paper-shadow"
          >
            <div className="max-h-[min(26rem,60dvh)] overflow-y-auto" aria-live="polite">
              {status === "loading" && (
                <div className="flex flex-col gap-1 p-2" aria-label="Đang tìm">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="flex gap-3 px-2 py-2.5">
                      <span className="size-5 animate-pulse rounded bg-paper-3" />
                      <span className="flex flex-1 flex-col gap-2">
                        <span className="h-3.5 w-3/5 animate-pulse rounded bg-paper-3" />
                        <span className="h-3 w-4/5 animate-pulse rounded bg-paper-3" />
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {status === "ready" && hits.length === 0 && (
                <div className="px-5 py-6">
                  <p className="font-semibold">Không tìm thấy &quot;{term}&quot;.</p>
                  <p className="mt-1 text-sm text-ink-2">
                    Thử gõ ngắn hơn, ví dụ &quot;hệ phương trình&quot; hoặc &quot;ax + by&quot;.
                    {!allGrades && " Hoặc tìm ở mọi lớp."}
                  </p>
                </div>
              )}
              <ul id={`${uid}-list`} role="listbox" aria-label="Kết quả tìm" className={hits.length ? "p-1.5" : "hidden"}>
                {hits.map((h, i) => {
                  const kind = kindOf(h);
                  const Icon = kindIcon[kind];
                  const on = i === activeIndex;
                  return (
                    <li
                      key={`${h.lessonId}-${i}`}
                      id={`${uid}-opt-${i}`}
                      role="option"
                      aria-selected={on}
                      onPointerEnter={() => setActive(i)}
                      onClick={() => choose(h)}
                      className={`flex cursor-pointer gap-3 rounded-[var(--radius-paper)] px-3 py-2.5 ${on ? "bg-paper-2" : ""}`}
                    >
                      <Icon size={18} className={`mt-0.5 shrink-0 ${on ? "text-coral-ink" : "text-ink-3"}`} aria-label={kindLabel[kind]} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold leading-snug text-ink">
                          <RichText text={kind === "topic" ? h.snippet : h.title} />
                        </span>
                        <span className="mt-0.5 block text-xs leading-normal text-ink-3">
                          {h.subjectName} {h.grade}
                          {kind === "topic" && (
                            <>
                              , mở bài <RichText text={h.title} />
                            </>
                          )}
                          {kind === "lesson" && `, ${h.snippet.replace("Chủ đề", "chủ đề").replace("Bài", "bài")}`}
                        </span>
                        {(kind === "formula" || kind === "text") && (
                          <span className="mt-1 block text-sm leading-snug text-ink-2">
                            <RichText text={h.snippet} />
                          </span>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="flex items-center gap-2 border-t border-line bg-paper-2 px-4 py-2 text-xs text-ink-2">
              <span className="mr-auto">{allGrades ? "Đang tìm ở mọi lớp." : `Đang tìm trong Lớp ${grade}.`}</span>
              <button
                type="button"
                onClick={() => setAllGrades((v) => !v)}
                className="h-8 rounded-full px-3 font-semibold text-ink hover:bg-paper-3"
              >
                {allGrades ? `Chỉ Lớp ${grade}` : "Tìm mọi lớp"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
