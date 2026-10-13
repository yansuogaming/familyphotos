"use client";

import { ArrowClockwise, Images } from "@phosphor-icons/react";
import { useEffect } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";

export default function AppError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6 lg:py-16">
      <div role="alert" className="oli oli-margin mx-auto max-w-2xl rounded-[var(--radius-paper)] border border-line py-12 pl-20 pr-6 paper-shadow sm:pr-10">
        <h1 className="font-hand text-4xl font-normal leading-tight tracking-normal text-ink">Trang này bị nhoè mực rồi.</h1>
        <p className="mt-3 max-w-[46ch] text-ink-2">
          Có lỗi khi mở phần này. Bấm Thử lại. Nếu vẫn vậy, tải lại cả trang hoặc quay về album ảnh.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button onClick={() => retry()}>
            <ArrowClockwise size={18} weight="bold" /> Thử lại
          </Button>
          <ButtonLink href="/anh" variant="secondary">
            <Images size={18} /> Về trang Ảnh
          </ButtonLink>
        </div>
        {error.digest && <p className="tabular mt-6 text-xs text-ink-3">Mã lỗi: {error.digest}</p>}
      </div>
    </div>
  );
}
