// 해 아이콘과 사이트 이름으로 된 로고(메인으로 가는 링크)
import Link from "next/link";
import { SITE_NAME } from "@/lib/site";

export function SiteLogo() {
  return (
    <Link href="/" className="inline-flex min-h-11 items-center gap-2 text-ink">
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="size-6 text-sun"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
      </svg>
      <span className="text-xl font-extrabold">{SITE_NAME}</span>
    </Link>
  );
}
