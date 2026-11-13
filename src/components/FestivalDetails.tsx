// 축제 포스트의 부품(대표 사진, 한눈에 보기, 예약·신청 안내, 근처 숙소, 주변 상설 행사, 출처)
// 내용은 모두 한국관광공사 관광정보 API의 값이다. 자료에 없는 내용은 만들지 않는다.
import type { Festival, FestivalSummary, OngoingEvent } from "@/lib/content";
import { formatDistance } from "@/lib/festivals";
import { formatDate } from "@/lib/format";

const KOGL_PAGE: Record<"Type1" | "Type3", { label: string; url: string }> = {
  Type1: { label: "공공누리 제1유형(출처표시)", url: "https://www.kogl.or.kr/info/licenseType1.do" },
  Type3: { label: "공공누리 제3유형(출처표시, 변경금지)", url: "https://www.kogl.or.kr/info/licenseType3.do" },
};

const outLink = "text-link underline underline-offset-2";
type NearPlace = Festival["foods"][number];

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
                    {lodging.grade && <OfficialBadge label={`${lodging.grade} 호텔`} className="ml-2 align-middle" />}
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

export function FestivalSourceLine({
  source,
  parkingSource,
  summarized,
}: {
  source: { url: string; fetchedOn: string };
  parkingSource: { url: string; referenceDate: string };
  summarized: boolean;
}) {
  return (
    <p className="text-sm leading-relaxed text-ink-muted">
      이 글은{" "}
      <a href={source.url} className={outLink} target="_blank" rel="noopener noreferrer">
        한국관광공사 관광정보 서비스
      </a>
      의 자료로 만들었고, 자료는 {formatDate(source.fetchedOn)}에 받았어요.
      {summarized && " 위의 짧은 소개는 원문 소개 글을 AI로 줄인 것이에요."} 먹을 곳의 모범음식점·백년가게와 숙소의
      호텔 등급은 행정안전부, 소상공인시장진흥공단, 문화체육관광부의 지정·결정 자료로 붙인 공식 표시이고 맛이나 서비스 평가는 아니에요.
      주차장은{" "}
      <a href={parkingSource.url} className={outLink} target="_blank" rel="noopener noreferrer">
        공공데이터포털 전국주차장정보표준데이터
      </a>
      ({formatDate(parkingSource.referenceDate)} 기준)예요. 일정과 요금은 바뀔 수 있으니 가기 전에 주최 측 안내를 확인해 주세요.
    </p>
  );
}

// 요약이 없을 때 보여줄 원문 앞부분. 문장 단위로 maxLength자 안에서 자른다.
function leadOf(text: string, maxLength = 140): string {
  const sentences = text.replace(/\n+/g, " ").split(/(?<=[.!?])\s+/);
  let lead = "";
  for (const s of sentences) {
    if ((lead + s).length > maxLength) break;
    lead = lead ? `${lead} ${s}` : s;
  }
  return lead || `${text.slice(0, maxLength).trim()}…`;
}

// 짧은 소개. 요약(한 줄 소개, 볼거리·할거리, 알아둘 점)이 있으면 그것을, 없으면 원문 앞부분을 보여준다.
export function FestivalSummaryBlock({ festival, summary }: { festival: Festival; summary?: FestivalSummary }) {
  if (!summary) {
    if (!festival.overview) return null;
    return (
      <section aria-label="짧은 소개">
        <p className="text-[18px] leading-[1.8]">{leadOf(festival.overview)}</p>
      </section>
    );
  }
  return (
    <section aria-label="짧은 소개" className="flex flex-col gap-5">
      <p className="text-[20px] font-bold leading-[1.6] sm:text-[22px]">{summary.oneLine}</p>
      <div>
        <h2 className="text-[17px] font-extrabold">볼거리·할거리</h2>
        <ul className="mt-2.5 flex flex-col gap-2">
          {summary.highlights.map((h) => (
            <li key={h} className="flex gap-2.5 text-[16px] leading-relaxed">
              <span aria-hidden className="mt-[0.6em] size-1.5 shrink-0 rounded-full bg-sun" />
              {h}
            </li>
          ))}
        </ul>
      </div>
      {summary.notes.length > 0 && (
        <div className="rounded-2xl bg-point-bg px-4 py-3.5">
          <h2 className="text-[15px] font-extrabold text-point-ink">알아둘 점</h2>
          <ul className="mt-1.5 flex flex-col gap-1 text-[15px] leading-relaxed">
            {summary.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

// 카카오맵 링크(키 없이 쓰는 주소 형식). 이름에 쉼표가 있으면 주소가 깨져서 빈칸으로 바꾼다.
function kakaoMapLinks(name: string, lat: number, lng: number) {
  const label = encodeURIComponent(name.replace(/,/g, " "));
  return {
    map: `https://map.kakao.com/link/map/${label},${lat},${lng}`,
    route: `https://map.kakao.com/link/to/${label},${lat},${lng}`,
  };
}

// 공식 인증·지정 표시(모범음식점, 백년가게, 호텔 등급). 맛 평가로 보이지 않게 차분한 색을 쓴다.
function OfficialBadge({ label, className = "" }: { label: string; className?: string }) {
  return (
    <span className={`inline-flex rounded-md border border-line-strong bg-surface-muted px-1.5 py-px text-[12px] font-bold text-ink-soft ${className}`}>
      {label}
    </span>
  );
}

function NearList({ title, places, empty }: { title: string; places: NearPlace[]; empty: string }) {
  return (
    <div>
      <h3 className="text-[17px] font-extrabold">{title}</h3>
      {places.length === 0 ? (
        <p className="mt-2 text-[15px] text-ink-muted">{empty}</p>
      ) : (
        <ul className="mt-2 flex flex-col gap-2.5">
          {places.map((p) => (
            <li key={p.name} className="text-[15px] leading-snug">
              <span className="font-bold">{p.name}</span>
              <span className="ml-1.5 text-ink-muted">{formatDistance(p.distance)}</span>
              {p.badges && (
                <span className="mt-1 flex flex-wrap gap-1">
                  {p.badges.map((b) => (
                    <OfficialBadge key={b} label={b} />
                  ))}
                </span>
              )}
              {p.address && <span className="mt-0.5 block text-[13px] text-ink-muted">{p.address}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// 위치와 주변 정보(주소, 카카오맵, 주차장, 먹을 곳, 볼거리). 축제 좌표를 기준으로 찾은 것이다.
export function FestivalLocation({ festival }: { festival: Festival }) {
  const links = kakaoMapLinks(festival.place || festival.name, festival.lat, festival.lng);
  const buttonClass = "inline-flex min-h-11 items-center rounded-xl border px-4 text-[14px] font-bold";
  return (
    <section aria-labelledby="festival-location">
      <h2 id="festival-location" className="text-[22px] font-extrabold">
        위치와 주변
      </h2>
      <div className="mt-3 rounded-[20px] border border-line p-5 sm:p-6">
        <p className="text-[16px] font-bold">{festival.place || festival.name}</p>
        {festival.address && <p className="mt-1 text-[15px] text-ink-muted">{festival.address}</p>}
        <div className="mt-4 flex flex-wrap gap-2">
          <a href={links.map} target="_blank" rel="noopener noreferrer" className={`${buttonClass} border-primary text-primary`}>
            카카오맵에서 보기
          </a>
          <a href={links.route} target="_blank" rel="noopener noreferrer" className={`${buttonClass} border-line-strong text-ink-soft`}>
            길찾기
          </a>
        </div>

        <h3 className="mt-7 text-[17px] font-extrabold">주차장</h3>
        {festival.parkings.length === 0 ? (
          <p className="mt-2 text-[15px] text-ink-muted">
            1km 안에 등록된 공영·민영 주차장 자료가 없어요. 대중교통이나 주최 측 주차 안내를 확인해 주세요.
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-line">
            {festival.parkings.map((p) => (
              <li key={p.name} className="py-3 first:pt-1 last:pb-0">
                <p className="text-[15px]">
                  <span className="font-bold">{p.name}</span>
                  <span className="ml-1.5 text-ink-muted">{formatDistance(p.distance)}</span>
                </p>
                <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[14px] text-ink-muted">
                  {p.kind && <span>{p.kind}</span>}
                  {p.spaces && <span>{p.spaces.toLocaleString("ko-KR")}면</span>}
                  {p.feeType && <span>{p.basicFee ?? p.feeType}</span>}
                  {p.weekdayHours && <span>평일 {p.weekdayHours}</span>}
                </p>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-7 grid gap-6 sm:grid-cols-2">
          <NearList title="먹을 곳" places={festival.foods} empty="2km 안에 관광공사 자료에 등록된 음식점이 없어요." />
          <NearList title="함께 볼 곳" places={festival.sights} empty="2km 안에 관광공사 자료에 등록된 관광지가 없어요." />
        </div>
        <p className="mt-6 text-[13px] text-ink-muted">거리는 축제 장소에서 잰 직선거리예요.</p>
      </div>
    </section>
  );
}

// 원문 소개와 프로그램 전체. 기본은 접혀 있다.
export function FestivalFullText({ festival }: { festival: Festival }) {
  if (!festival.overview && !festival.program && !festival.subEvent) return null;
  const textClass = "whitespace-pre-line text-[16px] leading-[1.85]";
  return (
    <details className="group rounded-[20px] border border-line">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-5 font-bold [&::-webkit-details-marker]:hidden">
        소개 전문과 프로그램 보기
        <span aria-hidden className="text-ink-muted transition-transform group-open:rotate-180">
          ▾
        </span>
      </summary>
      <div className="flex flex-col gap-6 border-t border-line px-5 py-5">
        {festival.overview && (
          <div>
            <h3 className="text-[17px] font-extrabold">소개</h3>
            <p className={`mt-2 ${textClass}`}>{festival.overview}</p>
          </div>
        )}
        {festival.program && (
          <div>
            <h3 className="text-[17px] font-extrabold">프로그램</h3>
            <p className={`mt-2 ${textClass}`}>{festival.program}</p>
          </div>
        )}
        {festival.subEvent && (
          <div>
            <h3 className="text-[17px] font-extrabold">부대행사</h3>
            <p className={`mt-2 ${textClass}`}>{festival.subEvent}</p>
          </div>
        )}
      </div>
    </details>
  );
}
