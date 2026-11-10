// 이용 안내 바로가기 목록(흰 줄 + ›, 이용 안내 목록·상세와 메인에서 쓴다)
import Link from "next/link";
import type { Guide } from "@/lib/content";

export function GuideLinks({ guides }: { guides: Guide[] }) {
  return (
    <ul className="flex flex-col gap-2.5">
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
  );
}
