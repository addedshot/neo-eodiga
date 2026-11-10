// 헤더 메뉴 링크 목록(현재 주소에 해당하는 메뉴에 밑줄과 aria-current를 단다)
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
    <ul className="flex gap-5 sm:gap-6">
      {NAV_ITEMS.map(({ href, label }) => {
        const isCurrent =
          currentPath !== null &&
          (currentPath === href || currentPath.startsWith(`${href}/`));
        return (
          <li key={href}>
            <Link
              href={href}
              aria-current={isCurrent ? "page" : undefined}
              className={`inline-flex min-h-11 items-center border-b-2 font-medium ${
                isCurrent
                  ? "border-primary text-ink"
                  : "border-transparent text-ink-muted hover:text-ink"
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
