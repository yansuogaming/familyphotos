// Safe expression evaluator for the calculator and coefficient inputs
// (no eval), plus number formatting for KaTeX output.

type Tok = { t: "num"; v: number } | { t: "id"; v: string } | { t: "op"; v: string };

const FUNCS = ["sin", "cos", "tan", "asin", "acos", "atan", "sqrt", "ln", "log", "abs"] as const;

function tokenize(src: string): Tok[] {
  const s = src.replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-").replace(/π/g, "pi").replace(/√/g, "sqrt");
  const out: Tok[] = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === " ") {
      i++;
      continue;
    }
    if (/[\d.,]/.test(c)) {
      let j = i;
      while (j < s.length && /[\d.,]/.test(s[j])) j++;
      const raw = s.slice(i, j).replace(",", ".");
      if ((raw.match(/\./g) ?? []).length > 1 || raw === ".") throw new Error("Số viết sai");
      out.push({ t: "num", v: Number(raw) });
      i = j;
      continue;
    }
    if (/[a-z]/i.test(c)) {
      let j = i;
      while (j < s.length && /[a-z]/i.test(s[j])) j++;
      out.push({ t: "id", v: s.slice(i, j).toLowerCase() });
      i = j;
      continue;
    }
    if ("+-*/^()!%".includes(c)) {
      out.push({ t: "op", v: c });
      i++;
      continue;
    }
    throw new Error(`Không hiểu kí tự "${c}"`);
  }
  return out;
}

function factorial(n: number) {
  if (n < 0 || !Number.isInteger(n) || n > 170) throw new Error("Giai thừa chỉ dùng cho số tự nhiên");
  let r = 1;
  for (let k = 2; k <= n; k++) r *= k;
  return r;
}

/** Evaluates "2sin(30)+√16", "3^2", "1/2", "0,5". Throws Error with a Vietnamese message. */
export function evaluate(src: string, opts: { deg?: boolean; ans?: number } = {}): number {
  const toks = tokenize(src);
  if (!toks.length) throw new Error("Chưa có phép tính");
  let p = 0;
  const peek = () => toks[p];
  const isOp = (v: string) => peek()?.t === "op" && peek()!.v === v;
  const ang = (x: number) => (opts.deg ? (x * Math.PI) / 180 : x);
  const fromAng = (x: number) => (opts.deg ? (x * 180) / Math.PI : x);

  function expr(): number {
    let v = term();
    while (isOp("+") || isOp("-")) {
      const op = toks[p++].v;
      const r = term();
      v = op === "+" ? v + r : v - r;
    }
    return v;
  }
  function startsFactor() {
    const k = peek();
    return !!k && (k.t === "num" || k.t === "id" || (k.t === "op" && k.v === "("));
  }
  function term(): number {
    let v = unary();
    for (;;) {
      if (isOp("*") || isOp("/")) {
        const op = toks[p++].v;
        const r = unary();
        if (op === "/" && r === 0) throw new Error("Không chia được cho 0");
        v = op === "*" ? v * r : v / r;
      } else if (startsFactor()) {
        v *= unary();
      } else return v;
    }
  }
  function unary(): number {
    if (isOp("-")) {
      p++;
      return -unary();
    }
    if (isOp("+")) {
      p++;
      return unary();
    }
    return power();
  }
  function power(): number {
    const base = postfix();
    if (isOp("^")) {
      p++;
      return base ** unary();
    }
    return base;
  }
  function postfix(): number {
    let v = primary();
    while (isOp("!") || isOp("%")) {
      v = toks[p++].v === "!" ? factorial(v) : v / 100;
    }
    return v;
  }
  function primary(): number {
    const k = toks[p++];
    if (!k) throw new Error("Phép tính chưa xong");
    if (k.t === "num") return k.v;
    if (k.t === "op" && k.v === "(") {
      const v = expr();
      if (!isOp(")")) throw new Error("Thiếu dấu đóng ngoặc");
      p++;
      return v;
    }
    if (k.t === "id") {
      if (k.v === "pi") return Math.PI;
      if (k.v === "e") return Math.E;
      if (k.v === "ans") return opts.ans ?? 0;
      if ((FUNCS as readonly string[]).includes(k.v)) {
        const x = isOp("(") ? primary() : unary();
        switch (k.v) {
          case "sin": return Math.sin(ang(x));
          case "cos": return Math.cos(ang(x));
          case "tan": return Math.tan(ang(x));
          case "asin": return fromAng(Math.asin(x));
          case "acos": return fromAng(Math.acos(x));
          case "atan": return fromAng(Math.atan(x));
          case "sqrt":
            if (x < 0) throw new Error("Không lấy căn bậc hai của số âm");
            return Math.sqrt(x);
          case "ln": return Math.log(x);
          case "log": return Math.log10(x);
          case "abs": return Math.abs(x);
        }
      }
      throw new Error(`Không hiểu "${k.v}"`);
    }
    throw new Error("Phép tính viết sai");
  }

  const v = expr();
  if (p < toks.length) throw new Error(isOp(")") ? "Thừa dấu đóng ngoặc" : "Phép tính viết sai");
  if (!Number.isFinite(v) || Number.isNaN(v)) throw new Error("Kết quả không xác định");
  return v;
}

/** Clean float noise: 0.1+0.2 -> 0.3. */
export const tidy = (n: number) => (Math.abs(n) < 1e-12 ? 0 : Number(n.toPrecision(12)));

/** Display number Vietnamese style ("1.234,5"). */
export function viNum(n: number, maxFrac = 10) {
  const t = tidy(n);
  if (t !== 0 && (Math.abs(t) >= 1e15 || Math.abs(t) < 1e-7)) return t.toExponential(6).replace(".", ",");
  return t.toLocaleString("vi-VN", { maximumFractionDigits: maxFrac });
}

/** Best fraction p/q with q <= maxDen when it is exact. */
export function toFraction(n: number, maxDen = 1000): [number, number] | null {
  if (Number.isInteger(tidy(n))) return [tidy(n), 1];
  for (let q = 2; q <= maxDen; q++) {
    const p = Math.round(n * q);
    if (Math.abs(p / q - n) < 1e-9) return [p, q];
  }
  return null;
}

/** TeX for a number: integer, \frac, or decimal with Vietnamese comma. */
export function tex(n: number): string {
  const f = toFraction(n);
  if (f) {
    const [p, q] = f;
    if (q === 1) return String(p);
    return `${p < 0 ? "-" : ""}\\dfrac{${Math.abs(p)}}{${q}}`;
  }
  return String(Number(tidy(n).toFixed(6))).replace(".", "{,}");
}

/** Wrap negatives in parentheses for substitution: (-3). */
export const texP = (n: number) => (n < 0 ? `\\left(${tex(n)}\\right)` : tex(n));

/** "2x - 3y + 1" from [[2,"x"],[-3,"y"],[1,""]]. Skips zero terms, hides coefficient 1. */
export function texPoly(terms: [number, string][]): string {
  let out = "";
  for (const [c, v] of terms) {
    if (tidy(c) === 0) continue;
    const abs = Math.abs(c);
    const body = v && tidy(abs) === 1 ? v : `${tex(abs)}${v}`;
    if (!out) out = c < 0 ? `-${body}` : body;
    else out += c < 0 ? ` - ${body}` : ` + ${body}`;
  }
  return out || "0";
}

/** sqrt(n) for a positive integer as k*sqrt(m). */
export function simplifySqrt(n: number): [number, number] {
  let k = 1;
  let m = n;
  for (let d = 2; d * d <= m; d++) {
    while (m % (d * d) === 0) {
      m /= d * d;
      k *= d;
    }
  }
  return [k, m];
}

/** Strip Vietnamese diacritics for search. */
const MARKS = new RegExp("\\p{M}", "gu");
export const fold = (s: string) => s.normalize("NFD").replace(MARKS, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();
