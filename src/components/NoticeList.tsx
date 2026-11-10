// 공지 제목과 날짜를 한 줄씩 보여주는 목록(공지 목록 페이지와 메인에서 쓴다)
import Link from "next/link";
import type { Notice } from "@/lib/content";
import { formatDate } from "@/lib/format";

export function NoticeList({ notices }: { notices: Notice[] }) {
  return (
    <ul>
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
  );
}
