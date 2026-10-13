"use client";

import { ArrowCounterClockwise, ArrowSquareOut, Eye, EyeSlash } from "@phosphor-icons/react";
import { useMemo, useState, type ReactNode } from "react";
import { LoadError } from "@/components/album/PhotosScreen";
import { useToast } from "@/components/settings/shared";
import { Button } from "@/components/ui/Button";
import { defaultSite, siteApi } from "@/lib/api/site";
import type { SiteContent, SiteSection } from "@/lib/api/site-types";
import { useApi } from "@/lib/hooks/useApi";
import { ImageField } from "../ImageField";
import { SaveBar } from "../SaveBar";
import { ConfirmDialog, PageHeader, TextArea, TextField, errorText } from "../ui";
import { useUnsavedChanges } from "../unsaved";
import { LandingPreview, LoginPreview, RegisterPreview } from "./ContentPreview";

type Page = "landing" | "login" | "register";
const pages: { id: Page; label: string; href: string }[] = [
  { id: "landing", label: "Trang chủ", href: "/" },
  { id: "login", label: "Trang đăng nhập", href: "/dang-nhap" },
  { id: "register", label: "Trang đăng ký", href: "/dang-ky" },
];

type Errors = Record<string, string>;

const LIMIT = { title: 90, body: 280, short: 40 };

/** Required + max length for every text field. Keys are dotted paths. */
function validate(c: SiteContent): Errors {
  const e: Errors = {};
  const need = (path: string, v: string, max: number) => {
    if (!v.trim()) e[path] = "Ô này không được để trống.";
    else if (v.length > max) e[path] = `Dài quá ${max} ký tự. Hãy rút gọn.`;
  };
  const section = (path: string, s: SiteSection) => {
    need(`${path}.title`, s.title, LIMIT.title);
    need(`${path}.body`, s.body, LIMIT.body);
  };
  const l = c.landing;
  need("landing.heroTitle", l.heroTitle, LIMIT.title);
  if (l.heroHighlight && !l.heroTitle.includes(l.heroHighlight)) e["landing.heroHighlight"] = "Phần tô cam phải nằm nguyên văn trong tiêu đề.";
  need("landing.heroLead", l.heroLead, LIMIT.body);
  l.album.forEach((p, i) => {
    need(`landing.album.${i}.memo`, p.memo, LIMIT.short);
    if (p.date.length > 10) e[`landing.album.${i}.date`] = "Ngày ngắn thôi, ví dụ 17.02.";
  });
  (["photos", "chat", "learn", "assistant"] as const).forEach((k) => section(`landing.${k}`, l[k]));
  need("landing.privacy.statement", l.privacy.statement, LIMIT.body);
  l.privacy.points.forEach((p, i) => section(`landing.privacy.points.${i}`, p));
  need("landing.closing", l.closing, LIMIT.title);
  need("login.coverLine", c.login.coverLine, LIMIT.title);
  need("login.greetingTitle", c.login.greetingTitle, LIMIT.short);
  need("login.greeting", c.login.greeting, LIMIT.body);
  const r = c.register;
  need("register.title", r.title, LIMIT.short);
  need("register.lead", r.lead, LIMIT.body);
  section("register.member", r.member);
  section("register.guest", r.guest);
  need("register.sentTitle", r.sentTitle, LIMIT.title);
  need("register.sentBody", r.sentBody, LIMIT.body);
  return e;
}

const pageOf = (path: string) => path.split(".")[0] as Page;
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

export function ContentScreen() {
  const site = useApi(siteApi.get);
  return (
    <div>
      {site.status === "loading" && (
        <>
          <PageHeader title="Nội dung trang" description="Chữ và ảnh trên trang chủ, trang đăng nhập và trang đăng ký." />
          <div aria-busy="true" className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_440px]">
            <div className="flex flex-col gap-5">
              {Array.from({ length: 5 }, (_, i) => <div key={i} className="h-24 animate-pulse rounded-[var(--radius-paper)] bg-paper-2" />)}
            </div>
            <div className="hidden h-[560px] animate-pulse rounded-[var(--radius-paper)] bg-paper-2 xl:block" />
          </div>
        </>
      )}
      {site.status === "error" && (
        <>
          <PageHeader title="Nội dung trang" />
          <div className="mt-8"><LoadError onRetry={site.reload} what="nội dung trang" /></div>
        </>
      )}
      {site.status === "ready" && <Editor key={site.data.updatedAt ?? "default"} initial={site.data} />}
    </div>
  );
}

function Editor({ initial }: { initial: SiteContent }) {
  const toast = useToast();
  const [saved, setSaved] = useState(initial);
  const [draft, setDraft] = useState(initial);
  const [page, setPage] = useState<Page>("landing");
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [registerSent, setRegisterSent] = useState(false);

  const dirty = useMemo(() => !same(draft, saved), [draft, saved]);
  const changedPages = useMemo(() => new Set(pages.filter((p) => !same(draft[p.id], saved[p.id])).map((p) => p.id)), [draft, saved]);
  useUnsavedChanges(dirty);

  /** Edit the draft by mutating a copy. Clears the error on what changed. */
  function edit(path: string, fn: (d: SiteContent) => void) {
    setDraft((cur) => {
      const next = structuredClone(cur);
      fn(next);
      return next;
    });
    if (errors[path])
      setErrors((cur) => {
        const rest = { ...cur };
        delete rest[path];
        return rest;
      });
  }

  async function save() {
    const found = validate(draft);
    setErrors(found);
    setSaveError(null);
    const bad = Object.keys(found);
    if (bad.length) {
      const firstPage = pageOf(bad[0]);
      setPage(firstPage);
      setSaveError(`Còn ${bad.length} ô cần sửa${firstPage !== page ? ` ở ${pages.find((p) => p.id === firstPage)?.label.toLowerCase()}` : ""}.`);
      return;
    }
    setSaving(true);
    try {
      const next = await siteApi.save(draft);
      setSaved(next);
      setDraft(next);
      toast("Đã lưu. Trang công khai đã đổi theo.");
    } catch (e) {
      setSaveError(errorText(e, "Chưa lưu được. Thử lại sau ít phút."));
    } finally {
      setSaving(false);
    }
  }

  function discard() {
    setDraft(saved);
    setErrors({});
    setSaveError(null);
  }

  async function resetAll() {
    const next = await siteApi.reset();
    setSaved(next);
    setDraft(next);
    setErrors({});
    toast("Đã khôi phục chữ và ảnh mặc định.");
  }

  const current = pages.find((p) => p.id === page)!;
  const err = (path: string) => errors[path];

  const preview = (
    <div className="overflow-hidden rounded-[var(--radius-paper)] border border-line bg-paper-2">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5">
        <p className="text-sm font-semibold">Xem trước: {current.label.toLowerCase()}</p>
        {page === "register" && (
          <div role="group" aria-label="Trạng thái trang đăng ký" className="flex rounded-full border border-line bg-paper p-0.5 text-xs font-semibold">
            {[false, true].map((v) => (
              <button key={String(v)} aria-pressed={registerSent === v} onClick={() => setRegisterSent(v)} className={`h-8 rounded-full px-3 ${registerSent === v ? "bg-coral-wash text-ink" : "text-ink-2 hover:text-ink"}`}>
                {v ? "Sau khi gửi" : "Chọn vai trò"}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="max-h-[calc(100dvh-14rem)] overflow-y-auto overflow-x-hidden" aria-hidden="true" inert>
        <div style={{ zoom: 0.34 }} className="pointer-events-none select-none">
          {page === "landing" && <LandingPreview c={draft.landing} />}
          {page === "login" && <LoginPreview c={draft.login} />}
          {page === "register" && <RegisterPreview c={draft.register} cover={draft.login} sent={registerSent} />}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <PageHeader
        title="Nội dung trang"
        description="Chữ và ảnh trên trang chủ, trang đăng nhập và trang đăng ký. Bấm Lưu thì mọi người thấy ngay."
        actions={
          <>
            <a href={current.href} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold text-ink-2 hover:bg-paper-2 hover:text-ink">
              <ArrowSquareOut size={16} /> Mở {current.label.toLowerCase()}
            </a>
            <Button variant="secondary" size="sm" onClick={() => setConfirmReset(true)}>
              <ArrowCounterClockwise size={16} /> Khôi phục mặc định
            </Button>
          </>
        }
      />

      <div role="tablist" aria-label="Trang cần sửa" className="mt-6 flex gap-1 overflow-x-auto border-b border-line">
        {pages.map((p) => {
          const on = p.id === page;
          return (
            <button
              key={p.id}
              role="tab"
              id={`tab-${p.id}`}
              aria-selected={on}
              aria-controls="content-panel"
              onClick={() => setPage(p.id)}
              className={`relative flex h-11 shrink-0 items-center gap-2 px-4 text-sm font-semibold transition-colors ${on ? "text-ink" : "text-ink-2 hover:text-ink"}`}
            >
              {p.label}
              {changedPages.has(p.id) && <span className="size-2 rounded-full bg-coral" aria-label="có thay đổi chưa lưu" />}
              {on && <span aria-hidden="true" className="absolute inset-x-3 -bottom-px h-0.5 bg-coral" />}
            </button>
          );
        })}
      </div>

      <button onClick={() => setShowPreview((v) => !v)} aria-expanded={showPreview} className="mt-4 inline-flex h-10 items-center gap-2 rounded-full border border-line px-4 text-sm font-semibold text-ink-2 hover:text-ink xl:hidden">
        {showPreview ? <EyeSlash size={16} /> : <Eye size={16} />} {showPreview ? "Ẩn xem trước" : "Xem trước"}
      </button>
      {showPreview && <div className="mt-4 xl:hidden">{preview}</div>}

      <div className="mt-6 grid items-start gap-10 xl:grid-cols-[minmax(0,1fr)_440px]">
        <div id="content-panel" role="tabpanel" aria-labelledby={`tab-${page}`} className="min-w-0">
          {page === "landing" && <LandingForm c={draft.landing} edit={edit} err={err} />}
          {page === "login" && <LoginForm c={draft.login} edit={edit} err={err} />}
          {page === "register" && <RegisterForm c={draft.register} edit={edit} err={err} onFocusSent={setRegisterSent} />}
        </div>
        <div className="sticky top-6 hidden xl:block">{preview}</div>
      </div>

      <SaveBar dirty={dirty} saving={saving} onSave={save} onReset={discard} error={saveError ?? undefined} savedAt={saved.updatedAt} />

      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={resetAll}
        title="Khôi phục nội dung mặc định?"
        body="Mọi chữ và ảnh bạn đã đổi trên trang chủ, trang đăng nhập và trang đăng ký sẽ trở về như ban đầu. Ảnh đã tải lên vẫn còn trong thư viện."
        confirmLabel="Khôi phục"
      />
    </>
  );
}

type Edit = (path: string, fn: (d: SiteContent) => void) => void;
type Err = (path: string) => string | undefined;

function Group({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="border-t border-line py-8 first:border-t-0 first:pt-2">
      <h2 className="text-xl font-bold">{title}</h2>
      {description && <p className="mt-1 max-w-[60ch] text-sm text-ink-2">{description}</p>}
      <div className="mt-5 flex flex-col gap-5">{children}</div>
    </section>
  );
}

const count = (v: string, max: number) => (
  <span className={`tabular text-xs ${v.length > max ? "text-danger" : "text-ink-3"}`}>
    {v.length}/{max}
  </span>
);

function Text({ label, path, value, max, onChange, err, multiline = false, hint }: { label: string; path: string; value: string; max: number; onChange: (v: string) => void; err: Err; multiline?: boolean; hint?: string }) {
  const common = { label, value, error: err(path), hint, aside: count(value, max) };
  return multiline ? (
    <TextArea {...common} rows={3} onChange={(e) => onChange(e.target.value)} />
  ) : (
    <TextField {...common} onChange={(e) => onChange(e.target.value)} />
  );
}

function SectionFields({ base, s, edit, err, pick }: { base: string; s: SiteSection; edit: Edit; err: Err; pick: (d: SiteContent) => SiteSection }) {
  return (
    <>
      <Text label="Tiêu đề" path={`${base}.title`} value={s.title} max={LIMIT.title} err={err} onChange={(v) => edit(`${base}.title`, (d) => void (pick(d).title = v))} />
      <Text label="Đoạn giới thiệu" path={`${base}.body`} value={s.body} max={LIMIT.body} err={err} multiline onChange={(v) => edit(`${base}.body`, (d) => void (pick(d).body = v))} />
    </>
  );
}

const albumSlots = ["Trang trái, ảnh trên", "Trang trái, ảnh dưới", "Trang phải, ảnh trên", "Trang phải, ảnh dưới"];

function LandingForm({ c, edit, err }: { c: SiteContent["landing"]; edit: Edit; err: Err }) {
  return (
    <div>
      <Group title="Phần đầu trang" description="Câu đầu tiên khách nhìn thấy khi mở trang chủ.">
        <Text label="Tiêu đề lớn" path="landing.heroTitle" value={c.heroTitle} max={LIMIT.title} err={err} onChange={(v) => edit("landing.heroTitle", (d) => void (d.landing.heroTitle = v))} />
        <TextField
          label="Phần tô màu cam"
          value={c.heroHighlight}
          error={err("landing.heroHighlight")}
          hint="Chép nguyên văn vài chữ trong tiêu đề. Để trống nếu không muốn tô màu."
          onChange={(e) => edit("landing.heroHighlight", (d) => void (d.landing.heroHighlight = e.target.value))}
        />
        <Text label="Câu phụ" path="landing.heroLead" value={c.heroLead} max={LIMIT.body} err={err} multiline onChange={(v) => edit("landing.heroLead", (d) => void (d.landing.heroLead = v))} />
      </Group>

      <Group title="Cuốn album mở" description="Bốn ảnh trong cuốn album ở đầu trang, mỗi ảnh có một dòng ghi chú viết tay và ngày.">
        {c.album.map((p, i) => (
          <div key={i} className="flex flex-col gap-4 rounded-[var(--radius-paper)] border border-line p-4">
            <ImageField
              label={`Ảnh ${i + 1}: ${albumSlots[i]}`}
              value={p}
              defaultValue={defaultSite.landing.album[i]}
              onChange={(img) => edit(`landing.album.${i}`, (d) => void Object.assign(d.landing.album[i], { url: img.url, alt: img.alt, mediaId: img.mediaId }))}
            />
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_9rem]">
              <Text label="Ghi chú dưới ảnh" path={`landing.album.${i}.memo`} value={p.memo} max={LIMIT.short} err={err} onChange={(v) => edit(`landing.album.${i}.memo`, (d) => void (d.landing.album[i].memo = v))} />
              <TextField label="Ngày" value={p.date} placeholder="17.02" error={err(`landing.album.${i}.date`)} onChange={(e) => edit(`landing.album.${i}.date`, (d) => void (d.landing.album[i].date = e.target.value))} />
            </div>
          </div>
        ))}
      </Group>

      {([
        ["photos", "Mục Ảnh"],
        ["chat", "Mục Chat riêng"],
        ["learn", "Mục Học"],
        ["assistant", "Mục Trợ lý AI"],
      ] as const).map(([k, title]) => (
        <Group key={k} title={title}>
          <SectionFields base={`landing.${k}`} s={c[k]} edit={edit} err={err} pick={(d) => d.landing[k]} />
        </Group>
      ))}

      <Group title="Mục Riêng tư" description="Câu lớn trên nền xanh than và ba ý ngắn bên dưới.">
        <Text label="Câu lớn" path="landing.privacy.statement" value={c.privacy.statement} max={LIMIT.body} err={err} multiline onChange={(v) => edit("landing.privacy.statement", (d) => void (d.landing.privacy.statement = v))} />
        {c.privacy.points.map((p, i) => (
          <fieldset key={i} className="flex flex-col gap-4 rounded-[var(--radius-paper)] border border-line p-4">
            <legend className="px-1 text-sm font-semibold text-ink-2">Ý thứ {i + 1}</legend>
            <SectionFields base={`landing.privacy.points.${i}`} s={p} edit={edit} err={err} pick={(d) => d.landing.privacy.points[i]} />
          </fieldset>
        ))}
      </Group>

      <Group title="Câu kết" description="Dòng cuối trang, cạnh hai nút Đăng ký và Vào nhà.">
        <Text label="Câu kết" path="landing.closing" value={c.closing} max={LIMIT.title} err={err} onChange={(v) => edit("landing.closing", (d) => void (d.landing.closing = v))} />
      </Group>
    </div>
  );
}

const coverSlots = ["Ảnh nằm nghiêng bên trái", "Ảnh bên phải", "Ảnh nằm trên cùng"];

function LoginForm({ c, edit, err }: { c: SiteContent["login"]; edit: Edit; err: Err }) {
  return (
    <div>
      <Group title="Bìa album bên trái" description="Ba ảnh xếp chồng trên bìa xanh than, hiện ở trang đăng nhập và trang đăng ký trên máy tính.">
        {c.coverPhotos.map((p, i) => (
          <div key={i} className="rounded-[var(--radius-paper)] border border-line p-4">
            <ImageField
              label={`Ảnh ${i + 1}: ${coverSlots[i]}`}
              value={p}
              defaultValue={defaultSite.login.coverPhotos[i]}
              altHint="Ảnh trên bìa chỉ để trang trí, có thể để trống."
              onChange={(img) => edit(`login.coverPhotos.${i}`, (d) => void (d.login.coverPhotos[i] = { url: img.url, alt: img.alt, mediaId: img.mediaId }))}
            />
          </div>
        ))}
        <Text label="Câu chữ trên bìa" path="login.coverLine" value={c.coverLine} max={LIMIT.title} err={err} onChange={(v) => edit("login.coverLine", (d) => void (d.login.coverLine = v))} />
      </Group>
      <Group title="Lời chào" description="Tiêu đề và câu chào phía trên ô đăng nhập.">
        <Text label="Tiêu đề" path="login.greetingTitle" value={c.greetingTitle} max={LIMIT.short} err={err} onChange={(v) => edit("login.greetingTitle", (d) => void (d.login.greetingTitle = v))} />
        <Text label="Câu chào" path="login.greeting" value={c.greeting} max={LIMIT.body} err={err} multiline onChange={(v) => edit("login.greeting", (d) => void (d.login.greeting = v))} />
      </Group>
    </div>
  );
}

function RegisterForm({ c, edit, err, onFocusSent }: { c: SiteContent["register"]; edit: Edit; err: Err; onFocusSent: (sent: boolean) => void }) {
  return (
    <div>
      <div onFocus={() => onFocusSent(false)}>
        <Group title="Câu hỏi đầu trang">
          <Text label="Tiêu đề" path="register.title" value={c.title} max={LIMIT.short} err={err} onChange={(v) => edit("register.title", (d) => void (d.register.title = v))} />
          <Text label="Câu giải thích" path="register.lead" value={c.lead} max={LIMIT.body} err={err} multiline onChange={(v) => edit("register.lead", (d) => void (d.register.lead = v))} />
        </Group>
        <Group title="Lựa chọn Người trong nhà">
          <SectionFields base="register.member" s={c.member} edit={edit} err={err} pick={(d) => d.register.member} />
        </Group>
        <Group title="Lựa chọn Khách">
          <SectionFields base="register.guest" s={c.guest} edit={edit} err={err} pick={(d) => d.register.guest} />
        </Group>
      </div>
      <div onFocus={() => onFocusSent(true)}>
        <Group title="Thông báo sau khi gửi" description="Khách thấy dòng này sau khi gửi lời xin vào nhà.">
          <Text label="Tiêu đề" path="register.sentTitle" value={c.sentTitle} max={LIMIT.title} err={err} onChange={(v) => edit("register.sentTitle", (d) => void (d.register.sentTitle = v))} />
          <Text label="Nội dung" path="register.sentBody" value={c.sentBody} max={LIMIT.body} err={err} multiline onChange={(v) => edit("register.sentBody", (d) => void (d.register.sentBody = v))} />
        </Group>
      </div>
    </div>
  );
}
