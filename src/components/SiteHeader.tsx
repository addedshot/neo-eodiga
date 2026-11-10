// 모든 페이지 위에 놓이는 헤더(로고와 주 메뉴)
import { Suspense } from "react";
import { NavLinks, NavList } from "@/components/NavLinks";
import { SiteLogo } from "@/components/SiteLogo";

export function SiteHeader() {
  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex max-w-page flex-wrap items-center justify-between gap-x-3 gap-y-1 px-4 py-3.5 sm:px-6">
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
