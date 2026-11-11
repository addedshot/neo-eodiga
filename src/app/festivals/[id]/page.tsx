// 지역축제 포스트(공공데이터의 축제 항목으로 만든 글과 예상 날씨). 끝난 지 3일이 넘으면 404다.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { Breadcrumb } from "@/components/Breadcrumb";
import { FestivalStatusBadge } from "@/components/FestivalList";
import { FestivalWeather } from "@/components/FestivalWeather";
import { loadContent } from "@/lib/content";
import { festivalStatus, formatPeriod, todayInKorea } from "@/lib/festivals";
import { formatDate } from "@/lib/format";
import { pageMetadata } from "@/lib/metadata";

export async function generateMetadata({ params }: PageProps<"/festivals/[id]">): Promise<Metadata> {
  const { id } = await params;
  const festival = loadContent().festivals.find((f) => f.id === id);
  if (!festival) return {};
  return pageMetadata({
    title: festival.name,
    description: `${festival.sido} ${festival.sigungu}에서 열리는 축제예요. 기간은 ${festival.startDate}부터 ${festival.endDate}까지예요.`,
    path: `/festivals/${id}`,
  });
}

export default function FestivalPage({ params }: PageProps<"/festivals/[id]">) {
  return (
    <div className="mx-auto w-full max-w-page px-4 pb-16 pt-5 sm:px-6">
      <Breadcrumb items={[{ href: "/", label: "홈" }, { href: "/festivals", label: "지역축제" }]} />
      <Suspense fallback={<p className="mt-6 text-ink-muted">축제 정보를 불러오고 있어요.</p>}>
        <FestivalPost params={params} />
      </Suspense>
    </div>
  );
}

async function FestivalPost({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await connection();
  const today = todayInKorea();
  const { festivals, festivalSource } = loadContent();
  const festival = festivals.find((f) => f.id === id);
  const status = festival ? festivalStatus(festival, today) : null;
  if (!festival || !status) notFound();

  const details: [string, React.ReactNode][] = [
    ["기간", formatPeriod(festival, today)],
    ["지역", `${festival.sido} ${festival.sigungu}`],
    ["열리는 곳", festival.place || undefined],
    ["주소", festival.address],
    ["주관", festival.organizer],
    ["주최", festival.host],
    ["전화", festival.phone],
    [
      "홈페이지",
      festival.homepage && (
        <a href={festival.homepage} className="break-all text-link underline" target="_blank" rel="noopener noreferrer">
          {festival.homepage}
        </a>
      ),
    ],
  ];

  return (
    <>
      <article className="mt-3 max-w-3xl">
        <FestivalStatusBadge status={status} />
        <h1 className="mt-3 text-[30px] font-extrabold leading-[1.35] sm:text-[38px]">{festival.name}</h1>
        <dl className="mt-6 grid grid-cols-[auto_minmax(0,1fr)] gap-x-5 gap-y-2.5 rounded-[20px] border border-line p-5 text-[15px] sm:p-6">
          {details.map(
            ([label, value]) =>
              value && (
                <div key={label} className="contents">
                  <dt className="text-ink-muted">{label}</dt>
                  <dd>{value}</dd>
                </div>
              ),
          )}
        </dl>

        {festival.content && (
          <section aria-labelledby="festival-content" className="mt-10">
            <h2 id="festival-content" className="text-[22px] font-extrabold">
              축제 내용
            </h2>
            <p className="mt-3 text-[17px] leading-[1.85]">{festival.content}</p>
          </section>
        )}

        {status !== "종료" && (
          <section aria-labelledby="festival-weather" className="mt-10">
            <h2 id="festival-weather" className="text-[22px] font-extrabold">
              예상 날씨
            </h2>
            <div className="mt-3">
              <FestivalWeather festival={festival} today={today} />
            </div>
          </section>
        )}

        <p className="mt-10 text-sm text-ink-muted">
          이 글은{" "}
          <a href={festivalSource.url} className="text-link underline" target="_blank" rel="noopener noreferrer">
            공공데이터포털 전국문화축제표준데이터
          </a>
          의 항목으로 만들었어요.
          {festival.provider && ` 자료 제공 ${festival.provider}.`}
          {festival.referenceDate && ` 자료 기준일 ${formatDate(festival.referenceDate)}.`} 일정은 바뀔 수 있으니 가기 전에 주최 측
          안내를 확인해 주세요.
        </p>
      </article>
      <Link href="/festivals" className="mt-8 inline-flex min-h-11 items-center font-bold text-link">
        지역축제 목록으로
      </Link>
    </>
  );
}
