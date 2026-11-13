// 지역축제 포스트(한국관광공사 관광정보로 만든 글, 예약·신청 안내, 근처 숙소, 주변 상설 행사, 예상 날씨). 끝난 지 3일이 넘으면 404다.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { Breadcrumb } from "@/components/Breadcrumb";
import {
  FestivalAtAGlance,
  FestivalBooking,
  FestivalFullText,
  FestivalLocation,
  FestivalLodgings,
  FestivalNearbyEvents,
  FestivalPhoto,
  FestivalSourceLine,
  FestivalSummaryBlock,
} from "@/components/FestivalDetails";
import { FestivalStatusBadge } from "@/components/FestivalList";
import { FestivalWeather } from "@/components/FestivalWeather";
import { loadContent } from "@/lib/content";
import { distanceMeters, festivalSourceHash, festivalStatus, formatPeriod, todayInKorea } from "@/lib/festivals";
import { pageMetadata } from "@/lib/metadata";

// 주변 상설 행사는 축제 장소에서 이 거리 안의 것만, 가까운 순으로 몇 개까지 보여준다.
const NEARBY_RADIUS_M = 10000;
const NEARBY_COUNT = 3;

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

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="text-[22px] font-extrabold">
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

async function FestivalPost({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await connection();
  const today = todayInKorea();
  const { festivals, ongoingEvents, festivalSummaries, festivalSource, parkingSource } = loadContent();
  const festival = festivals.find((f) => f.id === id);
  const status = festival ? festivalStatus(festival, today) : null;
  if (!festival || !status) notFound();
  // 원문이 바뀐 뒤 아직 다시 요약하지 않았으면 옛 요약을 쓰지 않는다.
  const savedSummary = festivalSummaries[festival.id];
  const summary = savedSummary?.sourceHash === festivalSourceHash(festival) ? savedSummary : undefined;

  const nearby = ongoingEvents
    .map((event) => ({ event, distance: distanceMeters(festival, event) }))
    .filter((n) => n.distance <= NEARBY_RADIUS_M)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, NEARBY_COUNT);
  const contacts: [string, string | undefined][] = [
    ["주소", festival.address],
    ["전화", festival.phone],
    ["주최", festival.host],
    ["주관", festival.organizer !== festival.host ? festival.organizer : undefined],
  ];

  return (
    <>
      <header className="mt-3">
        <FestivalStatusBadge status={status} />
        <h1 className="mt-3 max-w-4xl text-[28px] font-extrabold leading-[1.35] sm:text-[38px]">{festival.name}</h1>
        <p className="mt-2 text-[16px] text-ink-muted">
          {festival.sido} {festival.sigungu}
          {festival.place && `, ${festival.place}`}
        </p>
      </header>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-10">
        <aside className="lg:order-2">
          <div className="flex flex-col gap-4 lg:sticky lg:top-6">
            <FestivalAtAGlance festival={festival} period={formatPeriod(festival, today)} />
          </div>
        </aside>

        <article className="flex min-w-0 flex-col gap-10 lg:order-1">
          <FestivalSummaryBlock festival={festival} summary={summary} />
          <FestivalPhoto festival={festival} />
          <FestivalBooking festival={festival} />
          <FestivalLocation festival={festival} />
          <FestivalLodgings festival={festival} />
          <FestivalNearbyEvents events={nearby} />
          {status !== "종료" && (
            <Section id="festival-weather" title="예상 날씨">
              <FestivalWeather festival={festival} today={today} />
            </Section>
          )}
          <FestivalFullText festival={festival} />
          <Section id="festival-contact" title="문의">
            <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-5 gap-y-2.5 text-[15px]">
              {contacts.map(
                ([label, value]) =>
                  value && (
                    <div key={label} className="contents">
                      <dt className="text-ink-muted">{label}</dt>
                      <dd>{value}</dd>
                    </div>
                  ),
              )}
            </dl>
          </Section>
          <FestivalSourceLine source={festivalSource} parkingSource={parkingSource} summarized={summary !== undefined} />
          <Link href="/festivals" className="inline-flex min-h-11 items-center self-start font-bold text-link">
            지역축제 목록으로
          </Link>
        </article>
      </div>
    </>
  );
}
