// 축제 포스트의 부품(대표 사진, 한눈에 보기, 예약·신청 안내, 근처 숙소, 주변 상설 행사, 출처)
// 내용은 모두 한국관광공사 관광정보 API의 값이다. 자료에 없는 내용은 만들지 않는다.
import type { Festival, OngoingEvent } from "@/lib/content";
import { formatDistance } from "@/lib/festivals";
import { formatDate } from "@/lib/format";

const KOGL_PAGE: Record<"Type1" | "Type3", { label: string; url: string }> = {
  Type1: { label: "공공누리 제1유형(출처표시)", url: "https://www.kogl.or.kr/info/licenseType1.do" },
  Type3: { label: "공공누리 제3유형(출처표시, 변경금지)", url: "https://www.kogl.or.kr/info/licenseType3.do" },
};

const outLink = "text-link underline underline-offset-2";

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

// 대표 사진. 변경금지 조건이라 자르거나 다시 압축하지 않고 원본을 그대로, 전체가 보이게 둔다.
export function FestivalPhoto({ festival }: { festival: Festival }) {
  if (!festival.image) return null;
  const license = KOGL_PAGE[festival.image.license];
  return (
    <figure className="overflow-hidden rounded-[20px] border border-line bg-surface-muted">
      <div className="flex justify-center p-3 sm:p-5">
        {/* 공공누리 제3유형(변경금지) 사진이라 Next 이미지 최적화로 크기나 형식을 바꾸지 않는다. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={festival.image.url}
          alt={`${festival.name} 대표 사진`}
          loading="eager"
          className="h-auto max-h-[560px] w-auto max-w-full rounded-lg object-contain"
        />
      </div>
      <figcaption className="border-t border-line bg-surface px-4 py-2.5 text-[13px] text-ink-muted">
        사진 한국관광공사,{" "}
        <a href={license.url} className={outLink} target="_blank" rel="noopener noreferrer">
          {license.label}
        </a>
      </figcaption>
    </figure>
  );
}

// 여러 줄로 온 값(요금, 시간)은 줄을 살려 보여준다.
function Lines({ value }: { value: string }) {
  return <span className="whitespace-pre-line">{value}</span>;
}

export function FestivalAtAGlance({ festival, period }: { festival: Festival; period: string }) {
  const free = festival.fee === "무료";
  const [homepage] = festival.links;
  const rows: [string, React.ReactNode][] = [
    ["기간", period],
    ["지역", `${festival.sido} ${festival.sigungu}`],
    ["장소", festival.place || festival.address],
    ["시간", festival.playTime && <Lines value={festival.playTime} />],
    [
      "요금",
      festival.fee &&
        (free ? (
          <span className="inline-flex rounded-full bg-visited-bg px-2.5 py-0.5 text-[13px] font-bold text-visited-ink">무료</span>
        ) : (
          <Lines value={festival.fee} />
        )),
    ],
    ["할인", festival.discount && <Lines value={festival.discount} />],
    ["연령", festival.ageLimit],
    ["소요 시간", festival.spendTime],
  ];
  return (
    <section aria-labelledby="festival-glance" className="rounded-[20px] border border-line bg-surface p-5 sm:p-6">
      <h2 id="festival-glance" className="text-[19px] font-extrabold">
        한눈에 보기
      </h2>
      <dl className="mt-4 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2.5 text-[15px] leading-relaxed">
        {rows.map(
          ([label, value]) =>
            value && (
              <div key={label} className="contents">
                <dt className="text-ink-muted">{label}</dt>
                <dd>{value}</dd>
              </div>
            ),
        )}
      </dl>
      {homepage && (
        <a
          href={homepage.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 text-[15px] font-bold text-white"
        >
          공식 홈페이지 열기
        </a>
      )}
    </section>
  );
}

// 자료에 적힌 예약·예매·사전 신청 문장을 그대로 보여준다. 문장이 없어도 "예약이 필요 없다"고 단정하지 않는다.
export function FestivalBooking({ festival }: { festival: Festival }) {
  const notes = festival.bookingNotes;
  return (
    <section aria-labelledby="festival-booking">
      <h2 id="festival-booking" className="text-[22px] font-extrabold">
        예약·신청 안내
      </h2>
      {notes.length > 0 ? (
        <>
          <p className="mt-2 text-[15px] text-ink-muted">축제 자료에 적힌 문장을 그대로 옮겼어요.</p>
          <ul className="mt-3 flex flex-col gap-2">
            {notes.map((note) => (
              <li key={note} className="border-l-[3px] border-sun bg-surface-muted py-2.5 pl-4 pr-3 text-[16px] leading-relaxed">
                {note}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="mt-3 text-[16px] leading-relaxed text-ink-muted">
          축제 자료에 예약이나 사전 신청 안내가 없어요. 가기 전에 공식 홈페이지나 전화로 확인해 주세요.
        </p>
      )}
      {festival.links.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2">
          {festival.links.map((link) => (
            <li key={link.url}>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center rounded-full border border-line-strong px-4 text-[14px] font-bold text-ink-soft"
              >
                {link.label ?? hostOf(link.url)}
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function FestivalLodgings({ festival }: { festival: Festival }) {
  return (
    <section aria-labelledby="festival-lodgings">
      <h2 id="festival-lodgings" className="text-[22px] font-extrabold">
        근처 숙소
      </h2>
      {festival.lodgings.length === 0 ? (
        <p className="mt-3 text-ink-muted">축제 장소 2km 안에 관광공사 자료에 등록된 숙소가 없어요.</p>
      ) : (
        <>
          <p className="mt-2 text-[15px] text-ink-muted">축제 장소에서 가까운 순이에요. 예약 링크는 숙소가 관광공사에 등록한 주소예요.</p>
          <ul className="mt-3 divide-y divide-line rounded-[20px] border border-line">
            {festival.lodgings.map((lodging) => (
              <li key={`${lodging.name}-${lodging.distance}`} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3.5 sm:px-5">
                <div className="min-w-0 flex-1">
                  <p className="font-bold">
                    {lodging.name}
                    <span className="ml-2 text-[14px] font-medium text-ink-muted">{formatDistance(lodging.distance)}</span>
                  </p>
                  {lodging.address && <p className="mt-0.5 text-[14px] text-ink-muted">{lodging.address}</p>}
                </div>
                {lodging.reservationUrl ? (
                  <a
                    href={lodging.reservationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 shrink-0 items-center rounded-xl border border-primary px-4 text-[14px] font-bold text-primary"
                  >
                    예약 페이지
                  </a>
                ) : (
                  lodging.phone && <span className="shrink-0 text-[14px] text-ink-muted">전화 {lodging.phone}</span>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

// 축제 장소 주변의 상설 행사(1월 1일~12월 31일로 적힌 행사)
export function FestivalNearbyEvents({ events }: { events: { event: OngoingEvent; distance: number }[] }) {
  if (events.length === 0) return null;
  return (
    <section aria-labelledby="festival-nearby">
      <h2 id="festival-nearby" className="text-[22px] font-extrabold">
        주변 상설 행사
      </h2>
      <p className="mt-2 text-[15px] text-ink-muted">축제와 함께 들르기 좋은, 1년 내내 열리는 행사예요.</p>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2">
        {events.map(({ event, distance }) => (
          <li key={event.id} className="flex flex-col gap-2 rounded-[20px] border border-line bg-surface-accent/40 p-[18px]">
            <p className="font-extrabold leading-snug">{event.name}</p>
            <p className="text-[14px] text-ink-muted">
              {formatDistance(distance)} 거리, {event.place || event.address}
            </p>
            {event.playTime && <p className="whitespace-pre-line text-[14px]">{event.playTime}</p>}
            {event.fee && <p className="whitespace-pre-line text-[14px]">요금 {event.fee}</p>}
            {event.links[0] && (
              <a href={event.links[0].url} target="_blank" rel="noopener noreferrer" className={`${outLink} mt-auto text-[14px] font-bold`}>
                {event.links[0].label ?? hostOf(event.links[0].url)}
              </a>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function FestivalSourceLine({ source }: { source: { url: string; fetchedOn: string } }) {
  return (
    <p className="text-sm leading-relaxed text-ink-muted">
      이 글은{" "}
      <a href={source.url} className={outLink} target="_blank" rel="noopener noreferrer">
        한국관광공사 관광정보 서비스
      </a>
      의 자료로 만들었고, 자료는 {formatDate(source.fetchedOn)}에 받았어요. 일정과 요금은 바뀔 수 있으니 가기 전에 주최 측 안내를
      확인해 주세요.
    </p>
  );
}
