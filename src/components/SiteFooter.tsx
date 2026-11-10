// 모든 페이지 아래에 놓이는 푸터(운영 안내, 메뉴, 저작권)
import Link from "next/link";
import { SiteLogo } from "@/components/SiteLogo";
import { NAV_ITEMS, SITE_NAME } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-surface-muted">
      <div className="mx-auto max-w-5xl px-4 py-8 text-sm text-ink-muted sm:px-6">
        <SiteLogo />
        <p className="mt-1">수익을 목적으로 하지 않는 개인 운영 사이트예요.</p>
        <nav aria-label="아래쪽 메뉴" className="mt-3">
          <ul className="flex flex-wrap gap-x-5">
            {NAV_ITEMS.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="inline-flex min-h-11 items-center hover:text-ink"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <p className="mt-2">© 2026 {SITE_NAME}</p>
      </div>
    </footer>
  );
}
