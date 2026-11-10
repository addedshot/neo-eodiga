// 모든 페이지 아래에 놓이는 푸터(운영 안내, 메뉴, 저작권)
import Link from "next/link";
import { FOOTER_ITEMS, SITE_NAME } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-surface-muted">
      <div className="mx-auto flex max-w-page flex-wrap items-start justify-between gap-3 px-4 py-7 text-sm text-ink-muted sm:px-6">
        <div>
          <p>{SITE_NAME} · 수익을 목적으로 하지 않는 개인 운영 사이트예요.</p>
          <p>© 2026 {SITE_NAME}</p>
        </div>
        <nav aria-label="아래쪽 메뉴">
          <ul className="flex flex-wrap gap-x-4">
            {FOOTER_ITEMS.map(({ href, label }) => (
              <li key={href}>
                <Link href={href} className="inline-flex min-h-11 items-center underline hover:text-ink">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
