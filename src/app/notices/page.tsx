// 공지사항 목록 페이지(최신순, 제목과 날짜 한 줄씩)
import type { Metadata } from "next";
import Link from "next/link";
import { loadContent } from "@/lib/content";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "공지사항" };

export default function NoticesPage() {
  const { notices } = loadContent();

  return (
    <div className="mx-auto w-full max-w-page px-4 pb-16 pt-8 sm:px-6">
      <h1 className="text-3xl font-extrabold sm:text-[38px] sm:leading-[1.35]">공지사항</h1>
      {notices.length > 0 ? (
        <ul className="mt-8 rounded-[20px] border border-line px-5 sm:px-6">
          {notices.map((notice) => (
            <li key={notice.slug} className="border-b border-line last:border-b-0">
              <Link href={`/notices/${notice.slug}`} className="flex min-h-14 items-center gap-3 py-3 text-ink">
                <span className="min-w-0 flex-1 font-medium">{notice.title}</span>
                <time dateTime={notice.date} className="shrink-0 text-sm text-ink-muted">
                  {formatDate(notice.date)}
                </time>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-8 text-ink-muted">아직 공지가 없어요.</p>
      )}
    </div>
  );
}
