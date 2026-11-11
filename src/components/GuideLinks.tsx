// 이용 안내 바로가기 목록(흰 줄 + ›, 이용 안내 목록·상세와 메인에서 쓴다)
import Link from "next/link";
import type { Guide } from "@/lib/content";

// row가 true면 넓은 화면에서 가로로 나란히 놓는다(메인의 "처음 오셨나요?").
export function GuideLinks({ guides, row = false }: { guides: Guide[]; row?: boolean }) {
  return (
    <ul className={row ? "grid gap-2.5 sm:grid-cols-3" : "flex flex-col gap-2.5"}>
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
