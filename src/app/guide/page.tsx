// 이용 안내 목록 페이지("처음 오셨나요?" 바로가기 모양으로 order 순)
import type { Metadata } from "next";
import Link from "next/link";
import { loadContent } from "@/lib/content";

export const metadata: Metadata = { title: "이용 안내" };

export default function GuidePage() {
  const { guides } = loadContent();

  return (
    <div className="mx-auto w-full max-w-page px-4 pb-16 pt-8 sm:px-6">
      <h1 className="text-3xl font-extrabold sm:text-[38px] sm:leading-[1.35]">이용 안내</h1>
      <p className="mt-2 text-ink-muted">사이트를 쓰는 방법과 후기, 사진을 잘 남기는 방법을 모았어요.</p>
      <ul className="mt-8 flex max-w-xl flex-col gap-2.5 rounded-[20px] bg-surface-muted p-5 sm:p-6">
        {guides.map((guide) => (
          <li key={guide.slug}>
            <Link
              href={`/guide/${guide.slug}`}
              className="flex min-h-12 items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 text-[15px] font-bold text-ink"
            >
              {guide.title}
              <span aria-hidden="true" className="text-link">›</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
