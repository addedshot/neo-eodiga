// 모든 페이지를 감싸는 루트 레이아웃(서체, 언어, 기본 메타데이터)
import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";
import "./globals.css";

const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  weight: ["400", "500", "700", "800"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${notoSansKr.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-10 focus:rounded-xl focus:border focus:border-line focus:bg-surface focus:px-4 focus:py-3 focus:font-medium focus:text-ink"
        >
          본문으로 건너뛰기
        </a>
        <SiteHeader />
        <main id="main" tabIndex={-1} className="flex flex-1 flex-col focus:outline-none">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
