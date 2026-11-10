// 사이트 이름 글자와 해 모양으로 된 로고(메인으로 가는 링크)
import Link from "next/link";
import { SITE_NAME } from "@/lib/site";

export function SiteLogo() {
  return (
    <Link href="/" className="inline-flex min-h-11 items-center text-ink">
      <span className="text-xl font-extrabold">{SITE_NAME}</span>
      <svg
        aria-hidden="true"
        viewBox="0 0 10 10"
        className="mb-3 ml-0.5 size-2.5 text-sun"
      >
        <circle cx="5" cy="5" r="5" fill="currentColor" />
      </svg>
    </Link>
  );
}
