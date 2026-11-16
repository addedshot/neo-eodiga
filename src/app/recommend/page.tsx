// 여행추천 첫 화면: 출발 시군구, 날짜, 누구와, 이동 수단을 고른다(주소 쿼리로 미리 채울 수 있다).
import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { RecommendForm } from "@/components/Recommend";
import { loadAttractionData } from "@/lib/attractions";
import { COMPANIONS, loadContent, type Companion } from "@/lib/content";
import { addDays, todayInKorea } from "@/lib/festivals";
import { pageMetadata } from "@/lib/metadata";
import { TRAVEL_MODES, type TravelMode } from "@/lib/recommend";
import { MAX_DAYS_AHEAD, nextSaturday } from "@/lib/recommend-params";

export const metadata: Metadata = pageMetadata({
  title: "여행추천",
  description: "출발 지역, 날짜, 누구와, 이동 수단을 고르면 그날 날씨와 축제를 보고 당일 여행지 3곳과 계획을 추천해요.",
  path: "/recommend",
});

export default function RecommendPage({ searchParams }: PageProps<"/recommend">) {
  return (
    <div className="mx-auto w-full max-w-page px-4 pb-16 pt-8 sm:px-6">
      <h1 className="text-[32px] font-extrabold leading-[1.3] sm:text-[42px]">어디 갈지 정해 드릴게요</h1>
      <p className="mt-3 max-w-2xl text-[17px] leading-[1.7] text-ink-soft">
        네 가지만 고르면 그날 날씨, 열리는 축제, 붐비는 정도를 보고 당일 여행지 3곳을 골라요. 오전, 점심, 오후 계획과 주차, 예약 안내까지 함께 보여 드려요.
      </p>
      <div className="mt-8">
        <Suspense fallback={<p className="text-ink-muted">고르는 칸을 준비하고 있어요.</p>}>
          <FormWithToday searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

async function FormWithToday({ searchParams }: { searchParams: PageProps<"/recommend">["searchParams"] }) {
  const params = await searchParams;
  await connection();
  const today = todayInKorea();
  const { regions } = loadContent();
  const { attractions } = loadAttractionData();
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const date = one(params.date);
  const companion = one(params.with);
  const by = one(params.by);
  return (
    <RecommendForm
      regions={regions}
      today={today}
      maxDate={addDays(today, MAX_DAYS_AHEAD)}
      coveredSido={[...new Set(attractions.map((a) => a.sido))]}
      values={{
        from: one(params.from),
        date: date && date >= today ? date : nextSaturday(today),
        with: (COMPANIONS as readonly string[]).includes(companion ?? "") ? (companion as Companion) : undefined,
        by: by && by in TRAVEL_MODES ? (by as TravelMode) : undefined,
      }}
    />
  );
}
