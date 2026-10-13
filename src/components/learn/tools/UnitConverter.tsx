"use client";

import { ArrowsLeftRight } from "@phosphor-icons/react";
import { useState } from "react";
import { Chips, SelectField } from "@/components/learn/practice/shared";
import { IconButton } from "@/components/ui/Button";
import { parseNumber } from "@/lib/api/practice";
import { viNum } from "./math-utils";

type Unit = { id: string; label: string; factor: number };
type Category = { id: string; label: string; units: Unit[]; temp?: boolean; tip?: string };

const categories: Category[] = [
  {
    id: "do-dai",
    label: "Độ dài",
    tip: "Hai đơn vị độ dài liền nhau hơn kém nhau 10 lần.",
    units: [
      { id: "km", label: "km", factor: 1000 },
      { id: "hm", label: "hm", factor: 100 },
      { id: "dam", label: "dam", factor: 10 },
      { id: "m", label: "m", factor: 1 },
      { id: "dm", label: "dm", factor: 0.1 },
      { id: "cm", label: "cm", factor: 0.01 },
      { id: "mm", label: "mm", factor: 0.001 },
    ],
  },
  {
    id: "khoi-luong",
    label: "Khối lượng",
    tip: "Hai đơn vị khối lượng liền nhau hơn kém nhau 10 lần.",
    units: [
      { id: "tan", label: "tấn", factor: 1_000_000 },
      { id: "ta", label: "tạ", factor: 100_000 },
      { id: "yen", label: "yến", factor: 10_000 },
      { id: "kg", label: "kg", factor: 1000 },
      { id: "hg", label: "hg", factor: 100 },
      { id: "dag", label: "dag", factor: 10 },
      { id: "g", label: "g", factor: 1 },
    ],
  },
  {
    id: "dien-tich",
    label: "Diện tích",
    tip: "Hai đơn vị diện tích liền nhau hơn kém nhau 100 lần. 1 ha = 10 000 m².",
    units: [
      { id: "km2", label: "km²", factor: 1_000_000 },
      { id: "ha", label: "ha", factor: 10_000 },
      { id: "m2", label: "m²", factor: 1 },
      { id: "dm2", label: "dm²", factor: 0.01 },
      { id: "cm2", label: "cm²", factor: 0.0001 },
      { id: "mm2", label: "mm²", factor: 0.000001 },
    ],
  },
  {
    id: "the-tich",
    label: "Thể tích",
    tip: "1 dm³ = 1 lít. Hai đơn vị thể tích liền nhau hơn kém nhau 1000 lần.",
    units: [
      { id: "m3", label: "m³", factor: 1000 },
      { id: "dm3", label: "dm³", factor: 1 },
      { id: "l", label: "lít", factor: 1 },
      { id: "cm3", label: "cm³", factor: 0.001 },
      { id: "ml", label: "ml", factor: 0.001 },
    ],
  },
  {
    id: "thoi-gian",
    label: "Thời gian",
    units: [
      { id: "ngay", label: "ngày", factor: 86400 },
      { id: "gio", label: "giờ", factor: 3600 },
      { id: "phut", label: "phút", factor: 60 },
      { id: "giay", label: "giây", factor: 1 },
    ],
  },
  {
    id: "van-toc",
    label: "Vận tốc",
    units: [
      { id: "kmh", label: "km/giờ", factor: 1000 / 3600 },
      { id: "ms", label: "m/giây", factor: 1 },
      { id: "mphut", label: "m/phút", factor: 1 / 60 },
    ],
  },
  {
    id: "nhiet-do",
    label: "Nhiệt độ",
    temp: true,
    units: [
      { id: "c", label: "°C", factor: 1 },
      { id: "f", label: "°F", factor: 1 },
      { id: "k", label: "K", factor: 1 },
    ],
  },
];

const toBase = (c: Category, u: Unit, v: number) => {
  if (!c.temp) return v * u.factor;
  if (u.id === "c") return v;
  if (u.id === "f") return ((v - 32) * 5) / 9;
  return v - 273.15;
};
const fromBase = (c: Category, u: Unit, v: number) => {
  if (!c.temp) return v / u.factor;
  if (u.id === "c") return v;
  if (u.id === "f") return (v * 9) / 5 + 32;
  return v + 273.15;
};

export function UnitConverter() {
  const [catId, setCatId] = useState("do-dai");
  const cat = categories.find((c) => c.id === catId)!;
  const [pairs, setPairs] = useState<Record<string, [string, string]>>({});
  const [from, to] = pairs[catId] ?? [cat.units[0].id, cat.units[3]?.id ?? cat.units[1].id];
  const [text, setText] = useState("1");

  const uFrom = cat.units.find((u) => u.id === from)!;
  const uTo = cat.units.find((u) => u.id === to)!;
  const value = parseNumber(text);
  const error = text.trim() && value === null ? "Nhập một số, ví dụ 2,5" : undefined;
  const result = value !== null ? fromBase(cat, uTo, toBase(cat, uFrom, value)) : null;

  const setPair = (f: string, t: string) => setPairs((p) => ({ ...p, [catId]: [f, t] }));
  const unitOptions = cat.units.map((u) => ({ value: u.id, label: u.label }));

  return (
    <div className="max-w-2xl">
      <Chips label="Loại đại lượng" value={catId} onChange={setCatId} options={categories.map((c) => ({ value: c.id, label: c.label }))} />

      <div className="mt-5 grid items-end gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
        <div className="grid grid-cols-[minmax(0,1fr)_110px] gap-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold">Số cần đổi</span>
            <input
              value={text}
              inputMode="decimal"
              autoComplete="off"
              onChange={(e) => setText(e.target.value)}
              aria-invalid={!!error}
              aria-describedby={error ? "doi-loi" : undefined}
              className={`tabular h-11 w-full rounded-[var(--radius-paper)] border bg-paper px-3 text-lg outline-none transition-colors focus:border-coral ${error ? "border-danger" : "border-line hover:border-ink-3"}`}
            />
          </label>
          <SelectField label="Từ" value={from} onChange={(f) => setPair(f, to)} options={unitOptions} />
        </div>
        <IconButton label="Đổi chiều" type="button" onClick={() => setPair(to, from)} className="mb-0.5 justify-self-center border border-line">
          <ArrowsLeftRight size={18} />
        </IconButton>
        <SelectField label="Sang" value={to} onChange={(t) => setPair(from, t)} options={unitOptions} />
      </div>
      {error && <p id="doi-loi" className="mt-2 text-sm text-danger">{error}</p>}

      <p className="tabular mt-6 font-display text-3xl font-semibold" aria-live="polite">
        {result !== null && value !== null ? (
          <>
            {viNum(value)} {uFrom.label} = <span className="text-coral-ink">{viNum(result)}</span> {uTo.label}
          </>
        ) : (
          <span className="text-xl text-ink-3">Nhập số để đổi.</span>
        )}
      </p>

      {value !== null && (
        <div className="mt-8">
          <h3 className="text-sm font-semibold text-ink-2">
            {viNum(value)} {uFrom.label} bằng
          </h3>
          <ul className="memo-lines mt-1">
            {cat.units
              .filter((u) => u.id !== uFrom.id)
              .map((u) => (
                <li key={u.id} className="tabular flex h-12 items-center justify-between gap-4 px-1">
                  <span className="font-hand text-lg text-ink-2">{u.label}</span>
                  <span className="font-semibold">{viNum(fromBase(cat, u, toBase(cat, uFrom, value)))}</span>
                </li>
              ))}
          </ul>
          {cat.tip && <p className="mt-3 text-sm text-ink-3">Mẹo: {cat.tip}</p>}
        </div>
      )}
    </div>
  );
}
