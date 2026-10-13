"use client";

import { ArrowLeft, Clock, DownloadSimple, FilePdf, ListNumbers, PencilSimpleLine } from "@/components/ui/icons";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { LoadError } from "@/components/album/PhotosScreen";
import { RichText } from "@/components/learn/Math";
import { RichLines, correctAnswerText } from "@/components/learn/practice/QuestionView";
import { Chips, EmptyNote, LearnHeader, SelectField } from "@/components/learn/practice/shared";
import { Button, buttonClass } from "@/components/ui/Button";
import { formatScore, practiceApi } from "@/lib/api/practice";
import type { ExamDetail, ExamKind, ExamSummary } from "@/lib/api/practice-types";
import { useApi } from "@/lib/hooks/useApi";
import { ExamRunner } from "./ExamRunner";

export const kindNames: Record<ExamKind, string> = {
  "giua-ky": "Giữa kỳ",
  "cuoi-ky": "Cuối kỳ",
  "vao-10": "Vào lớp 10",
  thpt: "Tốt nghiệp THPT",
};

const yearLabel = (e: Pick<ExamSummary, "kind" | "year">) => (e.kind === "vao-10" || e.kind === "thpt" ? `Năm ${e.year}` : `Năm học ${e.year}-${e.year + 1}`);

/** /learn/de-thi. `?exam=<id>` opens an exam, `&take=1` starts the timed attempt. */
export function ExamsScreen() {
  const params = useSearchParams();
  const id = params.get("exam");
  const doing = params.get("take") === "1";
  if (id) return <ExamLoader key={`${id}-${doing}`} id={id} doing={doing} />;
  return <Library />;
}

function Library() {
  const exams = useApi(practiceApi.exams);
  const [grade, setGrade] = useState(0);
  const [subject, setSubject] = useState("all");
  const [kind, setKind] = useState<ExamKind | "all">("all");
  const [year, setYear] = useState(0);

  const all = exams.status === "ready" ? exams.data : [];
  const subjects = [...new Map(all.map((e) => [e.subject.id, e.subject.name])).entries()];
  const years = [...new Set(all.map((e) => e.year))].sort((a, b) => b - a);
  const gradesHere = [...new Set(all.map((e) => e.grade))].sort((a, b) => a - b);
  const shown = all.filter((e) => (!grade || e.grade === grade) && (subject === "all" || e.subject.id === subject) && (kind === "all" || e.kind === kind) && (!year || e.year === year));

  const reset = () => {
    setGrade(0);
    setSubject("all");
    setKind("all");
    setYear(0);
  };

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 lg:py-8">
      <LearnHeader title="Đề thi" />
      <p className="mt-2 max-w-2xl text-ink-2 sm:pl-14">Đề kiểm tra giữa kỳ, cuối kỳ, đề vào lớp 10 và tốt nghiệp THPT. Đề có nhãn &quot;Làm trực tuyến&quot; được chấm điểm ngay.</p>

      <div className="mt-6 sm:pl-14">
        <Chips label="Loại đề" value={kind} onChange={setKind} options={[{ value: "all", label: "Tất cả" }, ...(Object.keys(kindNames) as ExamKind[]).map((k) => ({ value: k, label: kindNames[k] }))]} />
        <div className="mt-3 grid max-w-2xl grid-cols-3 gap-3">
          <SelectField label="Lớp" value={grade} onChange={setGrade} options={[{ value: 0, label: "Mọi lớp" }, ...gradesHere.map((g) => ({ value: g, label: `Lớp ${g}` }))]} />
          <SelectField label="Môn" value={subject} onChange={setSubject} options={[{ value: "all", label: "Mọi môn" }, ...subjects.map(([v, label]) => ({ value: v, label }))]} />
          <SelectField label="Năm" value={year} onChange={setYear} options={[{ value: 0, label: "Mọi năm" }, ...years.map((y) => ({ value: y, label: String(y) }))]} />
        </div>
      </div>

      <div className="mt-8 sm:pl-14">
        {exams.status === "loading" && (
          <div aria-busy="true" className="flex flex-col gap-2">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-[var(--radius-paper)] bg-paper-2" />
            ))}
          </div>
        )}
        {exams.status === "error" && <LoadError onRetry={exams.reload} what="thư viện đề" />}
        {exams.status === "ready" && shown.length === 0 && (
          <EmptyNote title="Không có đề nào khớp bộ lọc" action={<Button variant="secondary" onClick={reset}>Bỏ lọc</Button>}>
            Thử chọn &quot;Mọi năm&quot; hoặc loại đề khác.
          </EmptyNote>
        )}
        {shown.length > 0 && (
          <>
            <p className="tabular text-sm text-ink-3">{shown.length} đề</p>
            <ul className="mt-2 divide-y divide-line border-y border-line">
              {shown.map((e) => (
                <li key={e.id} className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:gap-6">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-ink-3">
                      {kindNames[e.kind]}. {e.subject.name}, lớp {e.grade}. {yearLabel(e)}
                    </p>
                    <Link href={`/learn/exams?exam=${e.id}`} className="mt-0.5 block font-display text-lg font-semibold hover:text-coral-ink">
                      {e.title}
                    </Link>
                    <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-2">
                      <span>{e.source}</span>
                      <span className="tabular inline-flex items-center gap-1"><Clock size={15} /> {e.durationMin} phút</span>
                      <span className="tabular inline-flex items-center gap-1"><ListNumbers size={15} /> {e.questionCount} câu</span>
                      {e.online ? (
                        <span className="rounded-full bg-coral-wash px-2 text-xs font-semibold text-coral-ink">Làm trực tuyến</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-ink-3"><FilePdf size={15} /> Bản PDF</span>
                      )}
                    </p>
                  </div>
                  {e.best !== undefined && (
                    <p className="tabular shrink-0 font-hand text-2xl text-coral-ink">
                      {formatScore(e.best)} điểm<span className="sr-only"> là điểm cao nhất</span>
                    </p>
                  )}
                  <div className="flex shrink-0 gap-2">
                    {e.online && (
                      <Link href={`/learn/exams?exam=${e.id}&take=1`} className={buttonClass("primary", "sm")}>
                        Làm bài
                      </Link>
                    )}
                    <Link href={`/learn/exams?exam=${e.id}`} className={buttonClass("secondary", "sm")}>
                      Xem đề
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

function ExamLoader({ id, doing }: { id: string; doing: boolean }) {
  const exam = useApi(() => practiceApi.exam(id), [id]);
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 lg:py-8">
      {exam.status === "loading" && (
        <div aria-busy="true">
          <div className="h-9 w-2/3 animate-pulse rounded bg-paper-3" />
          <div className="mt-6 h-96 animate-pulse rounded-[var(--radius-paper)] bg-paper-2" />
        </div>
      )}
      {exam.status === "error" && (
        <>
          <LearnHeader title="Đề thi" backHref="/learn/exams" backLabel="Về thư viện đề" />
          <div className="mt-6">
            <LoadError onRetry={exam.reload} what="đề thi" />
          </div>
        </>
      )}
      {exam.status === "ready" && (doing && exam.data.parts.length ? <ExamRunner exam={exam.data} /> : <ExamPaper exam={exam.data} />)}
    </div>
  );
}

/** Read-only view of the paper, with PDF download and optional answer key. */
function ExamPaper({ exam }: { exam: ExamDetail }) {
  const [key, setKey] = useState(false);
  const numbers = new Map(exam.parts.flatMap((p) => p.questions).map((q, i) => [q.id, i + 1]));
  return (
    <>
      <LearnHeader title={exam.title} backHref="/learn/exams" backLabel="Về thư viện đề" />
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-2 sm:pl-14">
        <span>{exam.source}</span>
        <span>{yearLabel(exam)}</span>
        <span className="tabular inline-flex items-center gap-1"><Clock size={15} /> {exam.durationMin} phút</span>
        <span className="tabular inline-flex items-center gap-1"><ListNumbers size={15} /> {exam.questionCount} câu</span>
      </div>
      <div className="mt-5 flex flex-wrap gap-3 sm:pl-14">
        {exam.parts.length > 0 && (
          <Link href={`/learn/exams?exam=${exam.id}&take=1`} className={buttonClass("primary")}>
            <PencilSimpleLine size={18} /> Làm bài, tính giờ {exam.durationMin} phút
          </Link>
        )}
        <a href={exam.pdfUrl} target="_blank" rel="noopener noreferrer" download className={buttonClass("secondary")}>
          <DownloadSimple size={18} /> Tải PDF
        </a>
        {exam.parts.length > 0 && (
          <Button variant="ghost" onClick={() => setKey((k) => !k)} aria-pressed={key}>
            {key ? "Ẩn đáp án" : "Hiện đáp án"}
          </Button>
        )}
      </div>

      <div className="mt-8 sm:pl-14">
        {exam.parts.length === 0 ? (
          <EmptyNote
            title="Đề này chỉ có bản PDF"
            action={
              <a href={exam.pdfUrl} target="_blank" rel="noopener noreferrer" className={buttonClass("primary")}>
                <FilePdf size={18} /> Mở bản PDF
              </a>
            }
          >
            Con tải đề về, làm ra giấy rồi nhờ bố mẹ hoặc trợ lý AI chấm giúp.
          </EmptyNote>
        ) : (
          <article className="oli oli-margin max-w-3xl rounded-[var(--radius-paper)] border border-line py-8 pl-20 pr-4 paper-shadow sm:pr-8">
            <header className="text-center">
              <p className="text-sm font-semibold text-ink-2">{exam.source}</p>
              <h2 className="mt-2 font-display text-2xl font-bold">{exam.title}</h2>
              <p className="text-sm text-ink-2">Thời gian làm bài {exam.durationMin} phút</p>
            </header>
            {exam.parts.map((part) => (
              <section key={part.id} className="mt-8">
                <h3 className="font-display text-lg font-semibold">{part.title}</h3>
                {part.instructions && <RichLines text={part.instructions} className="mt-2 block whitespace-pre-line text-ink-2" />}
                <ol className="mt-4 flex flex-col gap-5">
                  {part.questions.map((q) => {
                    const n = numbers.get(q.id);
                    return (
                      <li key={q.id}>
                        <p className="leading-relaxed">
                          <span className="font-semibold">Câu {n}. </span>
                          <RichText text={q.prompt} />
                        </p>
                        {q.type === "choice" && (
                          <ol className="mt-2 grid gap-x-6 gap-y-1 sm:grid-cols-2">
                            {q.choices.map((c, i) => (
                              <li key={i} className={key && i === q.answerIndex ? "font-semibold text-coral-ink" : ""}>
                                {"ABCD"[i]}. <RichText text={c} />
                              </li>
                            ))}
                          </ol>
                        )}
                        {key && (
                          <p className="mt-1 font-hand text-lg text-coral-ink">
                            Đáp án: <RichText text={correctAnswerText(q)} />
                          </p>
                        )}
                      </li>
                    );
                  })}
                </ol>
              </section>
            ))}
            <p className="mt-10 text-center font-semibold text-ink-3">Hết</p>
          </article>
        )}
      </div>
      <p className="mt-6 sm:pl-14">
        <Link href="/learn/exams" className="inline-flex h-10 items-center gap-1.5 text-sm font-semibold text-ink-2 hover:text-ink">
          <ArrowLeft size={16} /> Về thư viện đề
        </Link>
      </p>
    </>
  );
}
