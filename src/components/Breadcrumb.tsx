// 페이지 위쪽의 현재 위치 표시(홈 › 공지사항 같은 링크 줄)
import Link from "next/link";

export function Breadcrumb({ items }: { items: { href: string; label: string }[] }) {
  return (
    <nav aria-label="현재 위치" className="text-sm text-ink-muted">
      <ol className="flex flex-wrap items-center gap-x-2">
        {items.map((item, index) => (
          <li key={item.href} className="flex items-center gap-2">
            <Link href={item.href} className="inline-flex min-h-11 items-center underline">
              {item.label}
            </Link>
            {index < items.length - 1 && <span aria-hidden="true">›</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
