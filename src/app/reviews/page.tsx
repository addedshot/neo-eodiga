// 여행후기 목록 페이지(제목은 미리 만들고, 필터와 결과는 요청 때 주소 쿼리로 그린다)
import type { Metadata } from "next";
import { Suspense } from "react";
import { ReviewList } from "@/components/ReviewList";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "여행후기",
  description: "지역, 함께 간 사람, 태그로 직접 다녀온 여행 기록을 골라 보세요.",
  path: "/reviews",
});

export default function ReviewsPage({ searchParams }: PageProps<"/reviews">) {
  return (
    <div className="mx-auto w-full max-w-page px-4 pb-16 pt-8 sm:px-6">
      <h1 className="text-3xl font-extrabold sm:text-[38px] sm:leading-[1.35]">여행후기</h1>
      <p className="mt-2 text-ink-muted">직접 다녀온 여행 기록을 지역, 함께 간 사람, 태그로 골라 보세요.</p>
      <Suspense fallback={<p className="mt-8 text-ink-muted">후기를 불러오고 있어요.</p>}>
        <ReviewList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
