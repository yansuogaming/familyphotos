"use client";

import { useId, useState, type ReactNode } from "react";
import { Math as TeX, RichText } from "@/components/learn/Math";
import { evaluate, simplifySqrt, tex, texP, texPoly, tidy, viNum } from "./math-utils";

type Kind = "bac-nhat" | "bac-hai" | "he";
const kinds: { id: Kind; label: string; form: string }[] = [
  { id: "bac-nhat", label: "Bậc nhất", form: "ax + b = 0" },
  { id: "bac-hai", label: "Bậc hai", form: "ax^2 + bx + c = 0" },
  { id: "he", label: "Hệ hai ẩn", form: "\\begin{cases} a_1x + b_1y = c_1 \\\\ a_2x + b_2y = c_2 \\end{cases}" },
];

const fields: Record<Kind, { key: string; label: string }[]> = {
  "bac-nhat": [{ key: "a", label: "a" }, { key: "b", label: "b" }],
  "bac-hai": [{ key: "a", label: "a" }, { key: "b", label: "b" }, { key: "c", label: "c" }],
  he: [
    { key: "a1", label: "a₁" }, { key: "b1", label: "b₁" }, { key: "c1", label: "c₁" },
    { key: "a2", label: "a₂" }, { key: "b2", label: "b₂" }, { key: "c2", label: "c₂" },
  ],
};

const defaults: Record<Kind, Record<string, string>> = {
  "bac-nhat": { a: "2", b: "-6" },
  "bac-hai": { a: "1", b: "-5", c: "6" },
  he: { a1: "2", b1: "1", c1: "7", a2: "1", b2: "-1", c2: "2" },
};

type Step = { text: string; math?: string };
type Solution = { steps: Step[]; result: string; resultTex?: string };

function solveLinear(a: number, b: number): Solution {
  const eq = `${texPoly([[a, "x"], [b, ""]])} = 0`;
  if (tidy(a) === 0)
    return tidy(b) === 0
      ? { steps: [{ text: "Hệ số $a = 0$ và $b = 0$, phương trình thành $0 = 0$ luôn đúng." }], result: "Phương trình có vô số nghiệm." }
      : { steps: [{ text: `Hệ số $a = 0$, phương trình thành $${tex(b)} = 0$, vô lí.` }], result: "Phương trình vô nghiệm." };
  const x = -b / a;
  return {
    steps: [
      { text: "Phương trình cần giải:", math: eq },
      { text: "Chuyển hạng tử tự do sang vế phải và đổi dấu:", math: `${texPoly([[a, "x"]])} = ${tex(-b)}` },
      { text: `Chia hai vế cho $${tex(a)}$:`, math: `x = \\dfrac{${tex(-b)}}{${tex(a)}} = ${tex(x)}` },
    ],
    result: "Phương trình có nghiệm duy nhất:",
    resultTex: `x = ${tex(x)}`,
  };
}

function solveQuadratic(a: number, b: number, c: number): Solution {
  if (tidy(a) === 0) {
    const lin = solveLinear(b, c);
    return { ...lin, steps: [{ text: "Hệ số $a = 0$ nên đây là phương trình bậc nhất $bx + c = 0$." }, ...lin.steps] };
  }
  const eq = `${texPoly([[a, "x^2"], [b, "x"], [c, ""]])} = 0`;
  const d = tidy(b * b - 4 * a * c);
  const steps: Step[] = [
    { text: "Phương trình cần giải:", math: eq },
    { text: `Hệ số: $a = ${tex(a)}$, $b = ${tex(b)}$, $c = ${tex(c)}$.` },
    { text: "Tính biệt thức:", math: `\\Delta = b^2 - 4ac = ${texP(b)}^2 - 4 \\cdot ${texP(a)} \\cdot ${texP(c)} = ${tex(d)}` },
  ];
  if (d < 0) return { steps: [...steps, { text: "$\\Delta < 0$ nên phương trình vô nghiệm." }], result: "Phương trình vô nghiệm." };
  if (d === 0) {
    const x = -b / (2 * a);
    return {
      steps: [...steps, { text: "$\\Delta = 0$ nên phương trình có nghiệm kép:", math: `x_1 = x_2 = -\\dfrac{b}{2a} = -\\dfrac{${tex(b)}}{2 \\cdot ${texP(a)}} = ${tex(x)}` }],
      result: "Phương trình có nghiệm kép:",
      resultTex: `x_1 = x_2 = ${tex(x)}`,
    };
  }
  const sq = Math.sqrt(d);
  const x1 = (-b + sq) / (2 * a);
  const x2 = (-b - sq) / (2 * a);
  const exactRoot = Number.isInteger(tidy(sq)) || tex(sq).includes("frac");
  steps.push({ text: "$\\Delta > 0$ nên phương trình có hai nghiệm phân biệt:", math: "x_{1,2} = \\dfrac{-b \\pm \\sqrt{\\Delta}}{2a}" });
  if (exactRoot) {
    steps.push({ text: `$\\sqrt{\\Delta} = \\sqrt{${tex(d)}} = ${tex(sq)}$. Thay vào:`, math: `x_1 = \\dfrac{${tex(-b)} + ${texP(sq)}}{${tex(2 * a)}} = ${tex(x1)},\\quad x_2 = \\dfrac{${tex(-b)} - ${texP(sq)}}{${tex(2 * a)}} = ${tex(x2)}` });
    return { steps, result: "Phương trình có hai nghiệm:", resultTex: `x_1 = ${tex(x1)},\\quad x_2 = ${tex(x2)}` };
  }
  let rootTex = `\\sqrt{${tex(d)}}`;
  if (Number.isInteger(d)) {
    const [k, m] = simplifySqrt(d);
    if (k > 1) {
      rootTex = `${k}\\sqrt{${m}}`;
      steps.push({ text: "Rút gọn căn:", math: `\\sqrt{${d}} = ${rootTex}` });
    }
  }
  const exact = `x_{1,2} = \\dfrac{${tex(-b)} \\pm ${rootTex}}{${tex(2 * a)}}`;
  steps.push({ text: "Thay vào công thức nghiệm:", math: exact });
  steps.push({ text: `Giá trị gần đúng: $x_1 \\approx ${viNum(x1, 4).replace(",", "{,}")}$, $x_2 \\approx ${viNum(x2, 4).replace(",", "{,}")}$.` });
  return { steps, result: "Phương trình có hai nghiệm:", resultTex: exact };
}

function solveSystem(a1: number, b1: number, c1: number, a2: number, b2: number, c2: number): Solution {
  const sys = `\\begin{cases} ${texPoly([[a1, "x"], [b1, "y"]])} = ${tex(c1)} \\\\ ${texPoly([[a2, "x"], [b2, "y"]])} = ${tex(c2)} \\end{cases}`;
  const D = tidy(a1 * b2 - a2 * b1);
  const Dx = tidy(c1 * b2 - c2 * b1);
  const Dy = tidy(a1 * c2 - a2 * c1);
  const steps: Step[] = [{ text: "Hệ cần giải:", math: sys }];

  if ((tidy(a1) === 0 && tidy(b1) === 0 && tidy(c1) !== 0) || (tidy(a2) === 0 && tidy(b2) === 0 && tidy(c2) !== 0))
    return { steps: [...steps, { text: "Có một phương trình dạng $0 = c$ với $c \\ne 0$, vô lí." }], result: "Hệ vô nghiệm." };

  if (tidy(a1) !== 0 && tidy(a2) !== 0) {
    steps.push({
      text: `Nhân phương trình thứ nhất với $${texP(a2)}$, phương trình thứ hai với $${texP(a1)}$ để hệ số của $x$ bằng nhau:`,
      math: `\\begin{cases} ${texPoly([[a1 * a2, "x"], [b1 * a2, "y"]])} = ${tex(c1 * a2)} \\\\ ${texPoly([[a1 * a2, "x"], [b2 * a1, "y"]])} = ${tex(c2 * a1)} \\end{cases}`,
    });
    steps.push({ text: "Trừ vế theo vế (phương trình sau trừ phương trình trước):", math: `${texP(D)}\\,y = ${tex(Dy)}` });
  } else {
    steps.push({ text: "Tính hai hiệu chéo của hệ số:", math: `D = a_1b_2 - a_2b_1 = ${tex(D)},\\quad D_y = a_1c_2 - a_2c_1 = ${tex(Dy)}` });
  }

  if (D === 0) {
    if (Dx === 0 && Dy === 0) return { steps: [...steps, { text: "Được $0 \\cdot y = 0$, đúng với mọi $y$. Hai phương trình thực chất là một." }], result: "Hệ có vô số nghiệm." };
    return { steps: [...steps, { text: `Được $0 \\cdot y = ${tex(Dy || Dx)}$, vô lí.` }], result: "Hệ vô nghiệm." };
  }
  const y = Dy / D;
  const x = Dx / D;
  steps.push({ text: "Tìm $y$:", math: `y = \\dfrac{${tex(Dy)}}{${tex(D)}} = ${tex(y)}` });
  if (tidy(a1) !== 0)
    steps.push({ text: "Thế $y$ vào phương trình thứ nhất để tìm $x$:", math: `${texPoly([[a1, "x"]])} ${b1 * y < 0 ? "-" : "+"} ${tex(Math.abs(b1 * y))} = ${tex(c1)} \\Rightarrow x = ${tex(x)}` });
  else steps.push({ text: "Thế $y$ vào phương trình thứ hai để tìm $x$:", math: `${texPoly([[a2, "x"]])} ${b2 * y < 0 ? "-" : "+"} ${tex(Math.abs(b2 * y))} = ${tex(c2)} \\Rightarrow x = ${tex(x)}` });
  steps.push({ text: `Thử lại: $${texP(a1)} \\cdot ${texP(x)} + ${texP(b1)} \\cdot ${texP(y)} = ${tex(a1 * x + b1 * y)}$ và $${texP(a2)} \\cdot ${texP(x)} + ${texP(b2)} \\cdot ${texP(y)} = ${tex(a2 * x + b2 * y)}$. Đúng.` });
  return { steps, result: "Hệ có nghiệm duy nhất:", resultTex: `(x;\\ y) = \\left(${tex(x)};\\ ${tex(y)}\\right)` };
}

export function EquationSolver() {
  const id = useId();
  const [kind, setKind] = useState<Kind>("bac-hai");
  const [values, setValues] = useState(defaults);
  const [touched, setTouched] = useState(false);

  const v = values[kind];
  const parsed: Record<string, number> = {};
  const errors: Record<string, string> = {};
  for (const f of fields[kind]) {
    const raw = v[f.key] ?? "";
    if (!raw.trim()) {
      errors[f.key] = "Nhập một số";
      continue;
    }
    try {
      parsed[f.key] = evaluate(raw);
    } catch {
      errors[f.key] = "Chưa phải số";
    }
  }
  const ok = Object.keys(errors).length === 0;
  const p = parsed;
  const solution: Solution | null = ok
    ? kind === "bac-nhat"
      ? solveLinear(p.a, p.b)
      : kind === "bac-hai"
        ? solveQuadratic(p.a, p.b, p.c)
        : solveSystem(p.a1, p.b1, p.c1, p.a2, p.b2, p.c2)
    : null;

  const form = kinds.find((k) => k.id === kind)!;

  return (
    <div>
      <div role="tablist" aria-label="Loại phương trình" className="inline-flex rounded-full border border-line bg-paper-2 p-1">
        {kinds.map((k) => (
          <button
            key={k.id}
            role="tab"
            id={`${id}-tab-${k.id}`}
            aria-selected={kind === k.id}
            aria-controls={`${id}-panel`}
            onClick={() => {
              setKind(k.id);
              setTouched(false);
            }}
            className={`h-9 rounded-full px-4 text-sm font-semibold transition-colors ${kind === k.id ? "bg-paper text-ink shadow-[0_1px_3px_hsl(var(--shadow)/0.15)]" : "text-ink-2 hover:text-ink"}`}
          >
            {k.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-tab-${kind}`} className="mt-5">
        <div className="text-lg">
          <TeX tex={form.form} block />
        </div>
        <div className={`grid gap-3 ${kind === "he" ? "max-w-md grid-cols-3" : kind === "bac-hai" ? "max-w-md grid-cols-3" : "max-w-xs grid-cols-2"}`}>
          {fields[kind].map((f) => (
            <label key={f.key} className="flex flex-col gap-1">
              <span className="text-sm font-semibold">{f.label}</span>
              <input
                value={v[f.key] ?? ""}
                inputMode="decimal"
                autoComplete="off"
                onChange={(e) => {
                  setTouched(true);
                  setValues((all) => ({ ...all, [kind]: { ...all[kind], [f.key]: e.target.value } }));
                }}
                aria-invalid={touched && !!errors[f.key]}
                className={`tabular h-11 w-full rounded-[var(--radius-paper)] border bg-paper px-3 text-lg outline-none transition-colors focus:border-coral ${touched && errors[f.key] ? "border-danger" : "border-line hover:border-ink-3"}`}
              />
              {touched && errors[f.key] && <span className="text-xs text-danger">{errors[f.key]}</span>}
            </label>
          ))}
        </div>
        <p className="mt-2 text-sm text-ink-3">Nhập số nguyên, số thập phân (0,5) hoặc phân số (1/2). Kết quả tự cập nhật.</p>

        <section aria-live="polite" aria-label="Lời giải" className="oli oli-margin mt-6 rounded-[var(--radius-paper)] border border-line py-6 pl-20 pr-4 sm:pr-6">
          <span className="absolute left-0 top-5 w-14 text-center font-hand text-xl text-coral-ink" aria-hidden="true">
            Giải
          </span>
          {!solution ? (
            <p className="text-ink-2">Điền đủ các hệ số để xem lời giải.</p>
          ) : (
            <>
              <ol className="flex flex-col gap-3">
                {solution.steps.map((s, i) => (
                  <li key={i}>
                    <StepLine n={i + 1}>
                      <RichText text={s.text} />
                      {s.math && <TeX tex={s.math} block className="!my-2" />}
                    </StepLine>
                  </li>
                ))}
              </ol>
              <div className="mt-4 border-t border-rule pt-4">
                <p className="font-semibold">{solution.result}</p>
                {solution.resultTex && (
                  <div className="mt-1 inline-block rounded-[var(--radius-paper)] border-2 border-coral px-4 text-lg">
                    <TeX tex={solution.resultTex} block className="!my-2" />
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function StepLine({ n, children }: { n: number; children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="tabular mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-paper-3 text-xs font-semibold text-ink-2">{n}</span>
      <div className="min-w-0 flex-1 leading-relaxed">{children}</div>
    </div>
  );
}
