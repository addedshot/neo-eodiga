// 지역축제 페이지(제목은 미리 만들고, 달력과 목록은 오늘 날짜와 주소 쿼리로 요청 때 그린다)
import type { Metadata } from "next";
import { Suspense } from "react";
import { FestivalBoard } from "@/components/FestivalBoard";
import { FestivalSourceNote } from "@/components/FestivalSourceNote";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "지역축제",
  description: "전국 지역축제 일정을 달력과 목록으로 모았어요. 지역을 고르고 날짜를 눌러 그날 열리는 축제를 찾아보세요.",
  path: "/festivals",
});

export default function FestivalsPage({ searchParams }: PageProps<"/festivals">) {
  return (
    <div className="mx-auto w-full max-w-page px-4 pb-16 pt-8 sm:px-6">
      <h1 className="text-3xl font-extrabold sm:text-[38px] sm:leading-[1.35]">지역축제</h1>
      <p className="mt-2 text-ink-muted">전국 지역축제 일정이에요. 끝난 축제는 3일 동안만 보여줘요.</p>
      <Suspense fallback={<p className="mt-8 text-ink-muted">축제 일정을 불러오고 있어요.</p>}>
        <FestivalBoard searchParams={searchParams} />
      </Suspense>
      <FestivalSourceNote />
    </div>
  );
}
