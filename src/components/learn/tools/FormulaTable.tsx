"use client";

import { MagnifyingGlass } from "@phosphor-icons/react";
import { useState } from "react";
import { LoadError } from "@/components/album/PhotosScreen";
import { Math as TeX, RichText } from "@/components/learn/Math";
import { Chips, EmptyNote, SelectField } from "@/components/learn/practice/shared";
import { Button } from "@/components/ui/Button";
import { practiceApi } from "@/lib/api/practice";
import type { Formula } from "@/lib/api/practice-types";
import { useApi } from "@/lib/hooks/useApi";
import { fold } from "./math-utils";

export function FormulaTable() {
  const list = useApi(practiceApi.formulas);
  const [grade, setGrade] = useState<number | 0>(0);
  const [subject, setSubject] = useState<string>("all");
  const [q, setQ] = useState("");

  const all: Formula[] = list.status === "ready" ? list.data : [];
  const gradesHere = [...new Set(all.map((f) => f.grade))].sort((a, b) => a - b);
  const needle = fold(q.trim());
  const shown = all.filter(
    (f) =>
      (!grade || f.grade === grade) &&
      (subject === "all" || f.subject === subject) &&
      (!needle || fold(`${f.name} ${f.group} ${f.subject} ${f.note ?? ""}`).includes(needle)),
  );
  const byGrade = gradesHere.map((g) => ({ g, items: shown.filter((f) => f.grade === g) })).filter((x) => x.items.length);

  const reset = () => {
    setGrade(0);
    setSubject("all");
    setQ("");
  };

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-full border border-line bg-paper px-4 focus-within:border-coral sm:max-w-sm">
          <MagnifyingGlass size={18} className="shrink-0 text-ink-3" />
          <span className="sr-only">Tìm công thức</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm: diện tích, delta, Ohm..." className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-3" />
        </label>
        <SelectField
          label="Môn"
          className="w-40"
          value={subject}
          onChange={setSubject}
          options={[{ value: "all", label: "Tất cả các môn" }, { value: "Toán", label: "Toán" }, { value: "Vật lí", label: "Vật lí" }, { value: "Hoá học", label: "Hoá học" }]}
        />
      </div>
      {list.status === "ready" && (
        <Chips className="mt-3" label="Lớp" value={grade} onChange={setGrade} options={[{ value: 0, label: "Mọi lớp" }, ...gradesHere.map((g) => ({ value: g, label: `Lớp ${g}` }))]} />
      )}

      <div className="mt-5">
        {list.status === "loading" && (
          <div aria-busy="true" className="flex flex-col gap-2">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="h-14 animate-pulse rounded bg-paper-2" />
            ))}
          </div>
        )}
        {list.status === "error" && <LoadError onRetry={list.reload} what="bảng công thức" />}
        {list.status === "ready" && byGrade.length === 0 && (
          <EmptyNote title="Không thấy công thức nào" action={<Button variant="secondary" onClick={reset}>Xem tất cả</Button>}>
            Thử gõ ngắn hơn, ví dụ &quot;diện tích&quot;, hoặc bỏ bớt bộ lọc.
          </EmptyNote>
        )}
        {byGrade.map(({ g, items }) => (
          <section key={g} aria-labelledby={`ct-lop-${g}`} className="mb-8">
            <h3 id={`ct-lop-${g}`} className="font-display text-lg font-semibold">
              Lớp {g}
            </h3>
            <dl className="mt-2 divide-y divide-line border-y border-line">
              {items.map((f) => (
                <div key={f.id} className="grid gap-x-6 gap-y-1 py-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] sm:items-center">
                  <dt>
                    <span className="font-medium">{f.name}</span>
                    <span className="block text-sm text-ink-3">
                      {f.subject}, {f.group.toLowerCase()}
                    </span>
                  </dt>
                  <dd className="min-w-0">
                    <TeX tex={f.tex} className="block overflow-x-auto text-lg" />
                    {f.note && <RichText text={f.note} className="mt-0.5 block text-sm text-ink-2" />}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </div>
  );
}
