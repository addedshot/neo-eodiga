// 여행추천 결과: 고른 조건으로 당일 여행지 3곳과 추천 이유를 보여준다. 조건마다 다른 주소라 검색엔진에는 노출하지 않는다.
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Breadcrumb } from "@/components/Breadcrumb";
import { DestinationCard, TripSummary } from "@/components/Recommend";
import { loadContent } from "@/lib/content";
import { todayInKorea } from "@/lib/festivals";
import { parseTripInput } from "@/lib/recommend-params";
import { recommendDestinations } from "@/lib/recommend-server";

export const metadata: Metadata = { title: "추천 여행지", robots: { index: false } };

export default function RecommendResultPage({ searchParams }: PageProps<"/recommend/result">) {
  return (
    <div className="mx-auto w-full max-w-page px-4 pb-16 pt-5 sm:px-6">
      <Breadcrumb items={[{ href: "/", label: "홈" }, { href: "/recommend", label: "여행추천" }]} />
      <h1 className="mt-3 text-[30px] font-extrabold leading-[1.3] sm:text-[38px]">추천 여행지</h1>
      <Suspense fallback={<p className="mt-6 text-ink-muted">날씨와 축제를 보고 여행지를 고르고 있어요.</p>}>
        <Result searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Result({ searchParams }: { searchParams: PageProps<"/recommend/result">["searchParams"] }) {
  const params = await searchParams;
  await connection();
  const today = todayInKorea();
  const { regions } = loadContent();
  const { input, problems } = parseTripInput(params, new Set(regions.map((r) => r.code)), today);
  if (!input) {
    return (
      <div className="mt-6 rounded-[20px] bg-surface-muted p-6">
        <ul className="list-inside list-disc text-[16px]">
          {problems.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
        <Link href="/recommend" className="mt-4 inline-flex min-h-11 items-center font-bold text-link">
          조건 다시 고르기
        </Link>
      </div>
    );
  }
  const from = regions.find((r) => r.code === input.from)!;
  const { destinations, reachable, coveredSido, forecastAvailable } = await recommendDestinations(input, today);
  return (
    <>
      <div className="mt-3">
        <TripSummary input={input} from={from} />
      </div>
      {destinations.length === 0 ? (
        <div className="mt-6 max-w-2xl rounded-[20px] bg-surface-muted p-6 text-[16px] leading-relaxed">
          <p className="font-bold">고른 출발지에서 갈 만한 여행지를 아직 찾지 못했어요.</p>
          <p className="mt-2 text-ink-soft">
            지금은 {coveredSido.join("·")} 명소만 준비돼 있어요. {reachable === 0 ? "출발지에서 당일 거리 안에 준비된 지역이 없어요. " : ""}
            다른 지역은 차례로 채우고 있어요. 자가용을 고르면 더 넓게(150km) 찾아요.
          </p>
        </div>
      ) : (
        <>
          {!forecastAvailable && <p className="mt-4 text-[15px] text-ink-muted">고른 날의 예보가 아직 없어서 계절을 보고 골랐어요. 예보는 16일 전부터 반영돼요.</p>}
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {destinations.map((d, i) => (
              <DestinationCard key={d.region.code} destination={d} input={input} rank={i + 1} />
            ))}
          </div>
        </>
      )}
      <p className="mt-10 max-w-3xl text-sm leading-relaxed text-ink-muted">
        추천은 한국관광공사 관광정보와 관광지 집중률 예측, 한국관광 100선, 국가유산(사적·명승), 100대 명산, 지역축제 자료와 Open-Meteo 예보로 규칙에 따라 고른 거예요. 거리는 시군구의
        대략적인 위치로 잰 직선거리예요. 운영 시간과 요금은 바뀔 수 있으니 가기 전에 확인해 주세요.
      </p>
    </>
  );
}
