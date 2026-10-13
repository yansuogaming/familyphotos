"use client";

import { ArrowsIn, ArrowsOut, ListBullets, ListDashes, SidebarSimple } from "@/components/ui/icons";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LoadError } from "@/components/album/PhotosScreen";
import { StudyModeTabs } from "@/components/learn/StudyModeTabs";
import { buttonClass } from "@/components/ui/Button";
import { ApiError } from "@/lib/api/core";
import type { LessonDetail, SubjectOutline } from "@/lib/api/lesson-types";
import { type LessonSearchHit, lessonsApi, slugify } from "@/lib/api/lessons";
import { useApi } from "@/lib/hooks/useApi";
import { useSession } from "@/lib/session";
import { useFocusMode, usePref, useScrollSpy } from "./hooks";
import { LessonArticle, askAi, lessonAnchors } from "./LessonArticle";
import { LessonSearch } from "./LessonSearch";
import { Drawer } from "./Overlays";
import { OnThisPage, TableOfContents } from "./Panels";
import { ArticleSkeleton } from "./Skeletons";

const grades = Array.from({ length: 12 }, (_, i) => i + 1);
const pending = <T,>() => new Promise<T>(() => {});

/** /learn/ly-thuyet. State lives in the URL: ?grade=9&subject=toan&lesson=toan-9-c1-b1 (or &topic=2). */
export function LessonReader() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const user = useSession()?.user;

  const lopParam = Number(params.get("grade"));
  const grade = lopParam >= 1 && lopParam <= 12 ? lopParam : user?.grade ?? 9;
  const monParam = params.get("subject");
  const baiParam = params.get("lesson");
  const chuDe = Number(params.get("topic")) || 0;

  /* ---- data ---- */
  const subjects = useApi(() => lessonsApi.subjects(grade), [grade]);
  const subjectId = subjects.status === "ready" ? (subjects.data.find((s) => s.id === monParam) ?? subjects.data[0])?.id : undefined;

  const outline = useApi<SubjectOutline | null>(
    () => (subjectId ? lessonsApi.outline(grade, subjectId) : pending()),
    [grade, subjectId],
  );
  const topics = outline.status === "ready" && outline.data ? outline.data.topics : null;
  const lessonId =
    baiParam ??
    (topics ? ((chuDe && topics[chuDe - 1]?.lessons[0]?.id) || topics.find((t) => t.lessons.length)?.lessons[0]?.id) : undefined);
  const subjectEmpty = !baiParam && !!topics && !lessonId;

  const lesson = useApi<LessonDetail | null>(() => (lessonId ? lessonsApi.lesson(lessonId) : pending()), [lessonId]);
  const current = lesson.status === "ready" ? lesson.data : null;

  /* ---- URL ---- */
  const href = useCallback(
    (lop: number, mon?: string | null, bai?: string | null) => {
      const q = new URLSearchParams({ lop: String(lop) });
      if (mon) q.set("subject", mon);
      if (bai) q.set("lesson", bai);
      return `${pathname}?${q}`;
    },
    [pathname],
  );
  const hrefFor = useCallback(
    (id: string) => href(current?.grade ?? grade, current?.subject.id ?? subjectId, id),
    [href, current, grade, subjectId],
  );

  // Keep the URL pointing at the lesson actually shown (search hits, chu-de, defaults).
  useEffect(() => {
    if (!current) return;
    if (params.get("lesson") === current.id && params.get("subject") === current.subject.id && params.get("grade") === String(current.grade)) return;
    router.replace(href(current.grade, current.subject.id, current.id), { scroll: false });
  }, [current, params, router, href]);

  /* ---- layout state ---- */
  const [tocOpen, setTocOpen] = usePref("ly-thuyet:muc-luc", true);
  const [asideOpen, setAsideOpen] = usePref("ly-thuyet:trong-bai", true);
  const [drawer, setDrawer] = useState<"toc" | "aside" | null>(null);
  const focusRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const focus = useFocusMode(focusRef);

  const anchors = useMemo(
    () => (current ? lessonAnchors(current, outline.status === "ready" ? outline.data : null) : []),
    [current, outline],
  );
  const activeId = useScrollSpy(
    anchors.map((a) => a.id),
    `${current?.id ?? ""}:${focus.active}`,
  );

  const toTop = useCallback(() => {
    setDrawer(null);
    if (focus.active) focusRef.current?.scrollTo({ top: 0 });
    else if (gridRef.current && gridRef.current.getBoundingClientRect().top < 0) gridRef.current.scrollIntoView({ block: "start" });
  }, [focus.active]);

  const jump = useCallback((id: string) => {
    setDrawer(null);
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Wait a frame so a closing drawer gives scrolling back to the page.
    requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }));
  }, []);

  const onAskAi = useCallback(() => {
    if (!current) return;
    setDrawer(null);
    focus.exit();
    askAi(current);
  }, [current, focus]);

  const openHit = (hit: LessonSearchHit) => {
    const sameGrade = subjects.status === "ready" && hit.grade === grade;
    const mon = (sameGrade && subjects.data.find((s) => s.name === hit.subjectName)?.id) || slugify(hit.subjectName);
    router.replace(href(hit.grade, mon, hit.lessonId), { scroll: false });
    toTop();
  };

  /* ---- pieces ---- */
  const outlineState = outline.status === "ready" ? outline : outline.status === "error" ? outline : { status: "loading" as const };
  const toc = (group: string) => (
    <TableOfContents
      group={group}
      outline={outlineState}
      onRetry={outline.reload}
      currentLessonId={current?.id ?? lessonId}
      currentTopicId={current?.topic.id}
      hrefFor={hrefFor}
      onNavigate={toTop}
      onGeneralVideos={() => jump("video-chung")}
    />
  );
  const aside = current && (
    <OnThisPage lesson={current} anchors={anchors} activeId={activeId} onJump={jump} onAskAi={onAskAi} hrefFor={hrefFor} onNavigate={toTop} />
  );
  const subjectName = outline.status === "ready" ? outline.data?.subject.name : undefined;

  let body: ReactNode;
  if (subjects.status === "error") body = <LoadError onRetry={subjects.reload} what="danh sách môn" />;
  else if (outline.status === "error") body = <LoadError onRetry={outline.reload} what="mục lục" />;
  else if (subjectEmpty) body = <SubjectDrafting name={`${subjectName ?? "Môn này"} ${grade}`} canEdit={user?.role === "admin"} />;
  else if (lesson.status === "error") {
    const notFound = lesson.error instanceof ApiError && lesson.error.status === 404;
    body = notFound ? (
      <NotFound onReset={() => router.replace(href(grade, subjectId), { scroll: false })} />
    ) : (
      <LoadError onRetry={lesson.reload} what="bài học" />
    );
  } else if (!current) body = <ArticleSkeleton />;
  else body = <LessonArticle lesson={current} outline={outline.status === "ready" ? outline.data : null} hrefFor={hrefFor} onNavigate={toTop} onAskAi={onAskAi} />;

  const railBtn = "inline-flex size-10 items-center justify-center rounded-full text-ink-2 transition-colors hover:bg-paper-3 hover:text-ink";

  return (
    <div className="mx-auto max-w-[1400px] px-4 pt-6 sm:px-6">
      {/* title row */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-4">
        <h1 className="text-3xl font-bold sm:text-4xl">Lý thuyết</h1>
        <button onClick={focus.enter} disabled={!current} className={`${railBtn} disabled:opacity-40`} aria-label="Đọc toàn màn hình" title="Đọc toàn màn hình">
          <ArrowsOut size={20} />
        </button>
        <div className="-mx-4 w-[calc(100%+2rem)] overflow-x-auto px-4 sm:mx-0 sm:ml-auto sm:w-auto sm:px-0">
          <StudyModeTabs />
        </div>
      </div>

      {/* grade + search */}
      <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:gap-6">
        <nav aria-label="Chọn lớp" className="-mx-4 flex items-center gap-1 overflow-x-auto px-4 md:mx-0 md:px-0">
          <span className="mr-1.5 shrink-0 text-sm font-semibold text-ink-3">Lớp</span>
          {grades.map((g) => (
            <button
              key={g}
              onClick={() => {
                if (g === grade) return;
                router.replace(href(g, subjectId), { scroll: false });
                toTop();
              }}
              aria-label={`Lớp ${g}`}
              aria-current={g === grade ? "true" : undefined}
              className={`tabular inline-flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                g === grade ? "bg-ink text-paper" : "text-ink-2 hover:bg-paper-2 hover:text-ink"
              }`}
            >
              {g}
            </button>
          ))}
        </nav>
        <LessonSearch grade={grade} onOpen={openHit} className="md:ml-auto md:w-80" />
      </div>

      {/* subjects */}
      <nav aria-label="Môn học" className="-mx-4 mt-3 flex gap-1 overflow-x-auto border-b border-line px-4 sm:mx-0 sm:px-0">
        {subjects.status === "loading" &&
          [64, 48, 80, 112, 96, 72].map((w, i) => (
            <span key={i} className="my-3 mr-3 h-5 shrink-0 animate-pulse rounded bg-paper-3" style={{ width: w }} />
          ))}
        {subjects.status === "ready" &&
          subjects.data.map((s) => {
            const on = s.id === subjectId;
            return (
              <button
                key={s.id}
                onClick={() => {
                  if (on) return;
                  router.replace(href(grade, s.id), { scroll: false });
                  toTop();
                }}
                aria-current={on ? "true" : undefined}
                className={`relative h-12 shrink-0 whitespace-nowrap px-3 text-sm font-semibold transition-colors ${on ? "text-ink" : "text-ink-2 hover:text-ink"}`}
              >
                {s.name}
                {on && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-coral" aria-hidden="true" />}
              </button>
            );
          })}
      </nav>

      {/* below lg: open the panels as drawers */}
      <div className="sticky top-16 z-20 -mx-4 flex items-center gap-2 border-b border-line bg-paper/95 px-4 py-2 backdrop-blur-md sm:-mx-6 sm:px-6 lg:hidden">
        <button onClick={() => setDrawer("toc")} className={buttonClass("ghost", "sm")}>
          <ListBullets size={18} /> Mục lục
        </button>
        <button onClick={() => setDrawer("aside")} disabled={!current} className={buttonClass("ghost", "sm", "ml-auto")}>
          <ListDashes size={18} /> Trong bài này
        </button>
      </div>

      <div
        ref={gridRef}
        className="mt-8 scroll-mt-20 lg:grid lg:gap-8 xl:gap-10"
        style={{ gridTemplateColumns: `${tocOpen ? "17rem" : "2.5rem"} minmax(0,1fr) ${asideOpen ? "15rem" : "2.5rem"}` }}
      >
        {/* Mục lục */}
        <aside aria-label="Mục lục" className="max-lg:hidden">
          <div className="sticky top-20 flex max-h-[calc(100dvh-6rem)] flex-col">
            {tocOpen ? (
              <>
                <div className="flex items-center justify-between pb-2 pl-2">
                  <p className="font-display text-lg font-semibold">Mục lục</p>
                  <button onClick={() => setTocOpen(false)} className={railBtn} aria-label="Ẩn mục lục" title="Ẩn mục lục" aria-expanded="true">
                    <SidebarSimple size={20} />
                  </button>
                </div>
                <div className="-mr-2 min-h-0 overflow-y-auto pb-6 pr-2">{toc("toc")}</div>
              </>
            ) : (
              <button onClick={() => setTocOpen(true)} className={railBtn} aria-label="Hiện mục lục" title="Hiện mục lục" aria-expanded="false">
                <SidebarSimple size={20} />
              </button>
            )}
          </div>
        </aside>

        {/* lesson */}
        <div
          ref={focusRef}
          className={focus.active ? "fixed inset-0 z-50 overflow-y-auto bg-paper" : "min-w-0"}
          role={focus.active ? "dialog" : undefined}
          aria-modal={focus.active || undefined}
          aria-label={focus.active ? "Đọc toàn màn hình" : undefined}
        >
          {focus.active && (
            <div className="sticky top-0 z-10 border-b border-line bg-paper/95 backdrop-blur-md">
              <div className="mx-auto flex h-14 max-w-4xl items-center gap-3 px-4">
                <p className="min-w-0 flex-1 truncate text-sm text-ink-2">
                  {current ? `Bài ${current.index}. ${current.title}` : "Lý thuyết"}
                </p>
                <button onClick={focus.exit} className={buttonClass("ghost", "sm")} autoFocus>
                  <ArrowsIn size={18} /> Thoát toàn màn hình
                </button>
              </div>
            </div>
          )}
          <div className={focus.active ? "mx-auto max-w-4xl px-4 py-10" : ""}>{body}</div>
        </div>

        {/* Trong bài này */}
        <aside aria-label="Trong bài này" className="max-lg:hidden">
          <div className="sticky top-20 max-h-[calc(100dvh-6rem)] overflow-y-auto pb-6">
            {asideOpen ? (
              <>
                <div className="flex items-center justify-between pb-2">
                  <p className="font-display text-lg font-semibold">Trong bài này</p>
                  <button onClick={() => setAsideOpen(false)} className={railBtn} aria-label="Ẩn cột Trong bài này" title="Ẩn cột Trong bài này" aria-expanded="true">
                    <SidebarSimple size={20} className="-scale-x-100" />
                  </button>
                </div>
                {aside ?? (
                  <div className="flex flex-col gap-3 border-l border-line pl-3">
                    {[70, 55, 80, 60, 75].map((w, i) => (
                      <span key={i} className="h-3.5 animate-pulse rounded bg-paper-3" style={{ width: `${w}%` }} />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <button onClick={() => setAsideOpen(true)} className={railBtn} aria-label="Hiện cột Trong bài này" title="Hiện cột Trong bài này" aria-expanded="false">
                <SidebarSimple size={20} className="-scale-x-100" />
              </button>
            )}
          </div>
        </aside>
      </div>

      <Drawer open={drawer === "toc"} side="left" title="Mục lục" onClose={() => setDrawer(null)}>
        {toc("toc-drawer")}
      </Drawer>
      <Drawer open={drawer === "aside" && !!aside} side="right" title="Trong bài này" onClose={() => setDrawer(null)}>
        <div className="px-2">{aside}</div>
      </Drawer>
    </div>
  );
}

function SubjectDrafting({ name, canEdit }: { name: string; canEdit: boolean }) {
  return (
    <div className="oli oli-margin max-sm:before:left-4! rounded-[var(--radius-paper)] border border-rule py-12 pl-9 pr-6 sm:pl-20">
      <p className="font-display text-2xl font-semibold">{name} đang được soạn.</p>
      <p className="mt-2 max-w-[50ch] text-ink-2">
        Môn này chưa có chủ đề nào. Em chọn môn khác ở hàng trên, hoặc nhờ bố mẹ thêm bài trong mục Quản trị, Học liệu.
      </p>
      {canEdit && (
        <a href="/admin/lessons" className={buttonClass("primary", "md", "mt-6")}>
          Thêm chủ đề và bài
        </a>
      )}
    </div>
  );
}

function NotFound({ onReset }: { onReset: () => void }) {
  return (
    <div className="oli-margin max-sm:before:left-4! py-6 pl-9 sm:pl-20">
      <p className="font-display text-2xl font-semibold">Không tìm thấy bài này.</p>
      <p className="mt-2 max-w-[48ch] text-ink-2">Có thể bài đã được đổi tên hoặc chuyển sang chủ đề khác.</p>
      <button onClick={onReset} className={buttonClass("primary", "md", "mt-6")}>
        Mở bài đầu tiên của môn
      </button>
    </div>
  );
}
