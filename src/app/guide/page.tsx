// 이용 안내 목록 페이지("처음 오셨나요?" 바로가기 모양으로 order 순)
import type { Metadata } from "next";
import { GuideLinks } from "@/components/GuideLinks";
import { loadContent } from "@/lib/content";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "이용 안내",
  description: "사이트를 쓰는 방법과 후기, 사진을 잘 남기는 방법을 모았어요.",
  path: "/guide",
});

export default function GuidePage() {
  const { guides } = loadContent();

  return (
    <div className="mx-auto w-full max-w-page px-4 pb-16 pt-8 sm:px-6">
      <h1 className="text-3xl font-extrabold sm:text-[38px] sm:leading-[1.35]">이용 안내</h1>
      <p className="mt-2 text-ink-muted">사이트를 쓰는 방법과 후기, 사진을 잘 남기는 방법을 모았어요.</p>
      <div className="mt-8 max-w-xl rounded-[20px] bg-surface-muted p-5 sm:p-6">
        <GuideLinks guides={guides} />
      </div>
    </div>
  );
}
