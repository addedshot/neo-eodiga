// 헤더 메뉴 링크 목록(현재 주소에 해당하는 메뉴를 강조 바탕으로 표시하고 aria-current를 단다)
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/site";

export function NavLinks() {
  const pathname = usePathname();
  return <NavList currentPath={pathname} />;
}

// currentPath가 null이면 현재 메뉴 표시 없이 링크만 그린다(Suspense 대체 화면용).
export function NavList({ currentPath }: { currentPath: string | null }) {
  return (
    <ul className="flex flex-wrap gap-1">
      {NAV_ITEMS.map(({ href, label }) => {
        const isCurrent =
          currentPath !== null &&
          (currentPath === href || currentPath.startsWith(`${href}/`));
        return (
          <li key={href}>
            <Link
              href={href}
              aria-current={isCurrent ? "page" : undefined}
              className={`inline-flex min-h-11 items-center rounded-[10px] px-3.5 py-3 text-[15px] ${
                isCurrent
                  ? "bg-surface-accent font-bold text-link"
                  : "font-medium text-ink-soft hover:text-ink"
              }`}
            >
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
