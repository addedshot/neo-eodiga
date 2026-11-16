// 여행추천 당일 계획: 출발 → 오전 → 점심 → 오후 → 귀가. 조건마다 다른 주소라 검색엔진에는 노출하지 않는다.
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Breadcrumb } from "@/components/Breadcrumb";
import { DayPlanView, TripSummary } from "@/components/Recommend";
import { loadContent } from "@/lib/content";
import { todayInKorea } from "@/lib/festivals";
import { parseTripInput, tripQuery } from "@/lib/recommend-params";
import { recommendPlan } from "@/lib/recommend-server";

export const metadata: Metadata = { title: "당일 여행 계획", robots: { index: false } };

export default function RecommendPlanPage({ searchParams }: PageProps<"/recommend/plan">) {
  return (
    <div className="mx-auto w-full max-w-page px-4 pb-16 pt-5 sm:px-6">
      <Suspense fallback={<p className="mt-6 text-ink-muted">당일 계획을 만들고 있어요.</p>}>
        <Plan searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Plan({ searchParams }: { searchParams: PageProps<"/recommend/plan">["searchParams"] }) {
  const params = await searchParams;
  await connection();
  const today = todayInKorea();
  const { regions } = loadContent();
  const { input, to } = parseTripInput(params, new Set(regions.map((r) => r.code)), today);
  const result = input && to ? await recommendPlan(input, to, today) : undefined;
  if (!input || !result) {
    return (
      <div className="mt-6 rounded-[20px] bg-surface-muted p-6">
        <p className="font-bold">이 조건으로는 계획을 만들 수 없어요.</p>
        <Link href="/recommend" className="mt-4 inline-flex min-h-11 items-center font-bold text-link">
          조건 다시 고르기
        </Link>
      </div>
    );
  }
  const { destination, plan, from, fromCenter } = result;
  return (
    <>
      <Breadcrumb
        items={[
          { href: "/", label: "홈" },
          { href: "/recommend", label: "여행추천" },
          { href: `/recommend/result?${tripQuery(input)}`, label: "추천 여행지" },
        ]}
      />
      <h1 className="mt-3 text-[30px] font-extrabold leading-[1.3] sm:text-[38px]">
        {destination.region.sido} {destination.region.sigungu} 당일 여행
      </h1>
      <div className="mt-2">
        <TripSummary input={input} from={from} />
      </div>
      <div className="mt-6 max-w-4xl">
        <DayPlanView destination={destination} plan={plan} input={input} from={from} fromCenter={fromCenter} today={today} />
      </div>
      <p className="mt-6 max-w-3xl text-sm leading-relaxed text-ink-muted">
        이 계획은 주소에 조건이 담겨 있어 주소를 그대로 보내면 같은 계획을 볼 수 있어요. 명소 정보와 사진은 한국관광공사(사진은 공공누리 제3유형), 붐빔은 한국관광공사 관광지 집중률 예측,
        먹을 곳의 표시는 행정안전부·식약처·소상공인시장진흥공단의 공식 지정 자료, 주차장은 공공데이터포털 주차장 표준데이터, 날씨는 Open-Meteo(CC BY 4.0) 자료예요. 운영 시간과 요금은 바뀔 수
        있으니 가기 전에 확인해 주세요.
      </p>
    </>
  );
}
