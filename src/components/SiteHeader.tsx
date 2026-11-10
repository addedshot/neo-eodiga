// 모든 페이지 위에 놓이는 헤더(로고와 주 메뉴)
import { Suspense } from "react";
import { NavLinks, NavList } from "@/components/NavLinks";
import { SiteLogo } from "@/components/SiteLogo";

export function SiteHeader() {
  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex max-w-5xl flex-col px-4 pt-2 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-2">
        <SiteLogo />
        <nav aria-label="주 메뉴">
          <Suspense fallback={<NavList currentPath={null} />}>
            <NavLinks />
          </Suspense>
        </nav>
      </div>
    </header>
  );
}
