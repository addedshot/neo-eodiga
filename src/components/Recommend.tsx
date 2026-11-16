// 여행추천 화면 부품(조건 고르기, 목적지 카드, 당일 계획 순서). 내용은 모두 자료와 엔진 결과이고 지어내지 않는다.
import Link from "next/link";
import type { Attraction } from "@/lib/attractions";
import { COMPANIONS, type Companion, type Festival } from "@/lib/content";
import { formatDistance, formatPeriod } from "@/lib/festivals";
import { formatDate, withRo } from "@/lib/format";
import { kakaoMapLinks } from "@/lib/map-links";
import { RegionPicker } from "@/components/RegionPicker";
import { buildDayPlan, DISTANCE_OPTIONS, festivalWeekdays, TRAVEL_MODES, type DayPlan, type Destination, type ScoredAttraction, type TravelMode, type TripInput } from "@/lib/recommend";
import { tripQuery } from "@/lib/recommend-params";

type Region = { code: string; sido: string; sigungu: string };
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
export const dateLabel = (date: string) => `${formatDate(date)}(${WEEKDAYS[new Date(`${date}T00:00:00Z`).getUTCDay()]})`;
const outLink = "text-link underline underline-offset-2";

function Chip({ children, tone = "plain" }: { children: React.ReactNode; tone?: "plain" | "point" | "good" }) {
  const tones = {
    plain: "border-line-strong bg-surface text-ink-soft",
    point: "border-transparent bg-point-bg text-point-ink",
    good: "border-transparent bg-visited-bg text-visited-ink",
  };
  return <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[13px] font-bold ${tones[tone]}`}>{children}</span>;
}

const chipTone = (reason: string) =>
  reason.startsWith("축제") || reason === "한국관광 100선" || reason === "유네스코 세계유산" ? "point" : reason === "덜 붐빔" || reason === "아이와 가기 좋음" ? "good" : "plain";

// 1. 조건 고르기. 자바스크립트 없이도 되는 GET 폼이다.
export function RecommendForm({
  regions,
  values,
  today,
  maxDate,
  coveredSido,
  centers,
}: {
  regions: Region[];
  centers: Record<string, { lat: number; lng: number }>;
  values: { from?: string; date: string; with?: Companion; by?: TravelMode; km?: number };
  today: string;
  maxDate: string;
  coveredSido: string[];
}) {
  const pill =
    "flex min-h-11 cursor-pointer items-center rounded-full border border-line-strong bg-surface px-4 text-[15px] font-bold text-ink-soft has-checked:border-primary has-checked:bg-primary has-checked:text-white has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-primary";
  return (
    <form action="/recommend/result" method="get" className="flex flex-col gap-7 rounded-[24px] border border-line bg-surface p-5 sm:p-8">
      <div className="grid gap-6 sm:grid-cols-2">
        <RegionPicker regions={regions} centers={centers} defaultCode={values.from} />
        <label className="flex flex-col gap-2">
          <span className="text-[15px] font-extrabold">언제 가나요?</span>
          <input type="date" name="date" required min={today} max={maxDate} defaultValue={values.date} className="h-12 rounded-xl border border-line-strong bg-surface px-3 text-[16px]" />
          <span className="text-[13px] text-ink-muted">16일 안이면 예보를, 그보다 먼 날은 계절을 보고 골라요.</span>
        </label>
      </div>
      <fieldset>
        <legend className="text-[15px] font-extrabold">누구와 가나요?</legend>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {COMPANIONS.map((c) => (
            <label key={c} className={pill}>
              <input type="radio" name="with" value={c} required defaultChecked={values.with === c} className="sr-only" />
              {c}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="text-[15px] font-extrabold">어떻게 가나요?</legend>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {(Object.keys(TRAVEL_MODES) as TravelMode[]).map((m) => (
            <label key={m} className={pill}>
              <input type="radio" name="by" value={m} required defaultChecked={values.by === m} className="sr-only" />
              {TRAVEL_MODES[m].label}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="text-[15px] font-extrabold">얼마나 멀리 갈까요?</legend>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {DISTANCE_OPTIONS.map((km) => (
            <label key={km} className={pill}>
              <input type="radio" name="km" value={km} defaultChecked={(values.km ?? (values.by ? TRAVEL_MODES[values.by].radiusKm : 150)) === km} className="sr-only" />
              {km === 50 ? "가까운 곳 50km" : `${km}km`}
            </label>
          ))}
        </div>
        <p className="mt-2 text-[13px] text-ink-muted">출발지에서 잰 직선거리예요. 실제 길은 더 길 수 있어요.</p>
      </fieldset>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[14px] text-ink-muted">지금은 {coveredSido.join("·")} 명소로 추천해요. 다른 지역은 차례로 채우고 있어요.</p>
        <button type="submit" className="min-h-[52px] rounded-xl bg-primary px-7 text-[17px] font-bold text-white">
          여행지 추천 받기
        </button>
      </div>
    </form>
  );
}

// 조건 한 줄 요약. 예: "부산 수영구 출발 · 2026년 11월 21일(토) · 아이와 · 자가용"
export function TripSummary({ input, from }: { input: TripInput; from: Region }) {
  return (
    <p className="text-[16px] text-ink-soft">
      {from.sido} {from.sigungu} 출발, {dateLabel(input.date)}, {input.with}, {TRAVEL_MODES[input.by].label}, {input.km}km 안
      <Link href={`/recommend?${tripQuery(input)}`} className="ml-3 inline-flex min-h-11 items-center font-bold text-link">
        조건 바꾸기
      </Link>
    </p>
  );
}

// 관광공사 사진(공공누리 1·3유형). 변경금지 조건이라 자르지 않고 전체가 보이게 둔다.
function AttractionPhoto({ attraction, className = "" }: { attraction: Attraction; className?: string }) {
  if (!attraction.image) return null;
  return (
    <div className={`flex items-center justify-center bg-surface-muted ${className}`}>
      {/* 공공누리 제3유형(변경금지) 사진이라 Next 이미지 최적화로 크기나 형식을 바꾸지 않는다. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={attraction.image.url} alt={`${attraction.name} 사진`} loading="lazy" className="max-h-full max-w-full object-contain" />
    </div>
  );
}

// 2. 목적지 카드
export function DestinationCard({ destination, input, rank }: { destination: Destination; input: TripInput; rank: number }) {
  const plan = buildDayPlan(destination);
  const photoFrom = destination.attractions.find((s) => s.attraction.image)?.attraction;
  const afternoonName = plan.afternoon.kind === "festival" ? plan.afternoon.item.name : plan.afternoon.item.attraction.name;
  return (
    <article className="flex flex-col overflow-hidden rounded-[24px] border border-line bg-surface">
      {photoFrom && <AttractionPhoto attraction={photoFrom} className="h-48 border-b border-line" />}
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div>
          <p className="text-[13px] font-bold text-ink-muted">추천 {rank}</p>
          <h2 className="mt-1 text-[24px] font-extrabold leading-tight">
            {destination.region.sido} {destination.region.sigungu}
          </h2>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {destination.reasons.map((r) => (
            <Chip key={r} tone={chipTone(r)}>
              {r}
            </Chip>
          ))}
        </div>
        <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1.5 text-[15px]">
          <dt className="text-ink-muted">오전</dt>
          <dd className="font-bold">{plan.morning.attraction.name}</dd>
          <dt className="text-ink-muted">점심</dt>
          <dd>{plan.lunch ? plan.lunch.foods[0].name : "근처 먹을 곳 자료 없음"}</dd>
          <dt className="text-ink-muted">오후</dt>
          <dd className="font-bold">{afternoonName}</dd>
        </dl>
        <Link
          href={`/recommend/plan?${tripQuery(input, { to: destination.region.code })}`}
          className="mt-auto inline-flex min-h-12 items-center justify-center rounded-xl bg-primary px-5 text-[16px] font-bold text-white"
        >
          당일 계획 보기
        </Link>
      </div>
    </article>
  );
}

// 3. 당일 계획
const lead = (text: string | undefined, max = 120) => {
  if (!text) return undefined;
  const first = text.replace(/\n+/g, " ").split(/(?<=[.!?])\s+/)[0];
  return first.length <= max ? first : `${first.slice(0, max).trim()}…`;
};

function AttractionStop({ scored, withKid }: { scored: ScoredAttraction; withKid: boolean }) {
  const a = scored.attraction;
  const d = a.detail;
  const links = kakaoMapLinks(a.name, a.lat, a.lng);
  const rows: [string, string | undefined][] = [
    ["이용 시간", d?.useTime],
    ["쉬는 날", d?.restDate],
    ["요금", d?.fee],
    ["주차", d?.parking],
    ...(withKid ? ([["유모차", d?.babyCarriage]] as [string, string | undefined][]) : []),
  ];
  return (
    <div className="overflow-hidden rounded-[20px] border border-line bg-surface">
      <div className="grid sm:grid-cols-[minmax(0,1fr)_220px]">
        <div className="flex flex-col gap-3 p-5">
          <div className="flex flex-wrap items-center gap-1.5">
            <Chip>{a.indoor ? "실내" : "야외"}</Chip>
            {a.badges.map((b) => (
              <Chip key={b} tone={chipTone(b)}>
                {b}
              </Chip>
            ))}
            {scored.crowd !== undefined && <Chip tone={scored.crowd <= 40 ? "good" : "plain"}>예상 붐빔 {scored.crowd}/100</Chip>}
          </div>
          <h3 className="text-[21px] font-extrabold leading-snug">{a.name}</h3>
          {lead(d?.overview) && <p className="text-[15px] leading-relaxed text-ink-soft">{lead(d?.overview)}</p>}
          <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-[14px]">
            {rows.map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="text-ink-muted">{label}</dt>
                <dd className={`whitespace-pre-line ${value ? "" : "text-ink-muted"}`}>{value ?? "정보 없음, 가기 전에 확인해 주세요"}</dd>
              </div>
            ))}
          </dl>
          {a.parkings && a.parkings.length > 0 && (
            <p className="text-[14px] text-ink-muted">
              근처 주차장: {a.parkings.slice(0, 2).map((p) => `${p.name}(${formatDistance(p.distance)}${p.basicFee ? `, ${p.basicFee}` : p.feeType ? `, ${p.feeType}` : ""})`).join(" / ")}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <a href={links.map} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded-xl border border-primary px-4 text-[14px] font-bold text-primary">
              카카오맵에서 보기
            </a>
            <a href={links.route} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded-xl border border-line-strong px-4 text-[14px] font-bold text-ink-soft">
              길찾기
            </a>
            {d?.homepage && (
              <a href={d.homepage} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded-xl border border-line-strong px-4 text-[14px] font-bold text-ink-soft">
                홈페이지
              </a>
            )}
          </div>
        </div>
        <AttractionPhoto attraction={a} className="h-48 border-t border-line sm:h-full sm:border-l sm:border-t-0" />
      </div>
    </div>
  );
}

function FestivalStop({ festival, today }: { festival: Festival; today: string }) {
  return (
    <div className="flex flex-col gap-3 rounded-[20px] border border-line bg-surface p-5">
      <div className="flex flex-wrap gap-1.5">
        <Chip tone="point">그날 열리는 축제</Chip>
        {festivalWeekdays(festival) && <Chip>{festivalWeekdays(festival)!.label}</Chip>}
      </div>
      <h3 className="text-[21px] font-extrabold leading-snug">{festival.name}</h3>
      <p className="text-[15px] text-ink-soft">
        {formatPeriod(festival, today)}
        {festival.place && `, ${festival.place}`}
        {festival.playTime && <span className="mt-1 block whitespace-pre-line text-[14px] text-ink-muted">{festival.playTime}</span>}
      </p>
      <Link href={`/festivals/${festival.id}`} className="inline-flex min-h-11 items-center self-start rounded-xl border border-primary px-4 text-[14px] font-bold text-primary">
        축제 정보, 예약 안내, 주차 보기
      </Link>
    </div>
  );
}

function Step({ label, title, children, last = false }: { label: string; title?: string; children?: React.ReactNode; last?: boolean }) {
  return (
    <li className="relative grid grid-cols-[56px_minmax(0,1fr)] gap-3 sm:grid-cols-[72px_minmax(0,1fr)]">
      {!last && <span aria-hidden className="absolute bottom-0 left-[27px] top-12 w-px bg-line-strong sm:left-[35px]" />}
      <span className="z-10 flex size-14 items-center justify-center rounded-full bg-surface-accent text-[15px] font-extrabold text-primary sm:size-[72px] sm:text-[17px]">
        {label}
      </span>
      <div className="flex min-w-0 flex-col gap-3 pb-10 pt-3 sm:pt-5">
        {title && <p className="text-[17px] font-bold">{title}</p>}
        {children}
      </div>
    </li>
  );
}

const weatherTips: Record<DayPlan["weatherKind"], string> = {
  rain: "비 소식이 있어요. 실내 명소를 먼저 넣었어요. 우산과 갈아 신을 양말을 챙기세요.",
  hot: "더운 날이에요. 물과 모자를 챙기고 한낮에는 실내에서 쉬어 가세요.",
  cold: "추운 날이에요. 겉옷과 장갑을 챙기세요.",
  good: "야외 활동하기 좋은 날씨예요. 야외 명소를 오전에 넣었어요.",
  unknown: "예보는 여행 16일 전부터 볼 수 있어요. 계절에 맞춰 골랐으니 가까워지면 다시 확인해 주세요.",
};

export function DayPlanView({
  destination,
  plan,
  input,
  from,
  fromCenter,
  today,
}: {
  destination: Destination;
  plan: DayPlan;
  input: TripInput;
  from: Region;
  fromCenter: { lat: number; lng: number };
  today: string;
}) {
  const withKid = input.with === "아이와";
  const home = kakaoMapLinks(`${from.sido} ${from.sigungu}`, fromCenter.lat, fromCenter.lng);
  const first = plan.morning.attraction;
  return (
    <div className="flex flex-col gap-8">
      <section aria-label="날씨와 준비" className="rounded-[20px] bg-surface-accent px-5 py-4 sm:px-6">
        <p className="text-[16px] font-bold">
          {destination.weather
            ? `${dateLabel(input.date)} ${destination.region.sigungu} 예보: ${destination.weather.summary}, ${destination.weather.min}~${destination.weather.max}°${destination.weather.rainChance !== null ? `, 비 올 확률 ${destination.weather.rainChance}%` : ""}`
            : `${dateLabel(input.date)} 예보는 아직 없어요`}
        </p>
        <p className="mt-1 text-[15px] text-ink-soft">{weatherTips[plan.weatherKind]}</p>
      </section>

      <ol className="flex flex-col">
        <Step label="출발" title={`${from.sido} ${from.sigungu}에서 출발`}>
          <p className="text-[15px] text-ink-soft">
            {destination.region.sigungu}까지 직선거리 약 {destination.distanceKm}km예요. 걸리는 시간은 길찾기에서 확인해 주세요.
          </p>
          <a
            href={kakaoMapLinks(first.name, first.lat, first.lng).route}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center self-start rounded-xl border border-primary px-4 text-[14px] font-bold text-primary"
          >
            {first.name}까지 길찾기
          </a>
        </Step>
        <Step label="오전">
          <AttractionStop scored={plan.morning} withKid={withKid} />
        </Step>
        <Step label="점심">
          {plan.lunch ? (
            <div className="rounded-[20px] border border-line bg-surface p-5">
              <p className="text-[15px] text-ink-muted">{plan.lunch.from.name} 근처 먹을 곳</p>
              <ul className="mt-3 flex flex-col gap-3">
                {plan.lunch.foods.map((f) => {
                  return (
                    <li key={f.name} className="text-[15px]">
                      <span className="font-bold">{f.name}</span>
                      <span className="ml-1.5 text-ink-muted">{formatDistance(f.distance)}</span>
                      {f.badges && (
                        <span className="ml-2 inline-flex flex-wrap gap-1 align-middle">
                          {f.badges.map((b) => (
                            <span key={b} className="rounded-md border border-line-strong bg-surface-muted px-1.5 py-px text-[12px] font-bold text-ink-soft">
                              {b}
                            </span>
                          ))}
                        </span>
                      )}
                      {f.address && <span className="mt-0.5 block text-[13px] text-ink-muted">{f.address}</span>}
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <p className="text-[15px] text-ink-muted">근처 먹을 곳 자료가 없어요. 카카오맵에서 주변 식당을 찾아 주세요.</p>
          )}
        </Step>
        <Step label="오후">
          {plan.afternoon.kind === "festival" ? (
            <FestivalStop festival={plan.afternoon.item} today={today} />
          ) : (
            <AttractionStop scored={plan.afternoon.item} withKid={withKid} />
          )}
        </Step>
        <Step label="귀가" title={`${withRo(`${from.sido} ${from.sigungu}`)} 돌아오기`} last>
          <a href={home.route} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center self-start rounded-xl border border-line-strong px-4 text-[14px] font-bold text-ink-soft">
            집 방향 길찾기
          </a>
        </Step>
      </ol>

      {destination.uncertainFestivals.length > 0 && (
        <section aria-labelledby="plan-uncertain" className="rounded-[20px] border border-dashed border-line-strong p-5">
          <h2 id="plan-uncertain" className="text-[18px] font-extrabold">
            기간 중인 행사(날짜별 일정 확인 필요)
          </h2>
          <p className="mt-1 text-[14px] text-ink-muted">기간 안이지만 날마다 열리는지 자료로 알 수 없어서 계획에는 넣지 않았어요. 가기 전에 일정을 확인해 주세요.</p>
          <ul className="mt-2 flex flex-col">
            {destination.uncertainFestivals.slice(0, 5).map((f) => (
              <li key={f.id}>
                <Link href={`/festivals/${f.id}`} className="inline-flex min-h-11 items-center text-[15px] font-bold text-link">
                  {f.name}
                </Link>
                <span className="ml-2 text-[13px] text-ink-muted">{formatPeriod(f, today)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {plan.alternatives.length > 0 && (
        <section aria-labelledby="plan-alternatives">
          <h2 id="plan-alternatives" className="text-[20px] font-extrabold">
            바꿔 넣을 곳
          </h2>
          <p className="mt-1 text-[15px] text-ink-muted">날씨가 바뀌거나 문을 닫았을 때 대신 갈 만한 {destination.region.sigungu}의 명소예요.</p>
          <ul className="mt-3 grid gap-3 sm:grid-cols-3">
            {plan.alternatives.map((s) => (
              <li key={s.attraction.id} className="flex flex-col gap-2 rounded-[18px] border border-line p-4">
                <p className="font-extrabold">{s.attraction.name}</p>
                <div className="flex flex-wrap gap-1">
                  <Chip>{s.attraction.indoor ? "실내" : "야외"}</Chip>
                  {s.attraction.badges.slice(0, 2).map((b) => (
                    <Chip key={b} tone={chipTone(b)}>
                      {b}
                    </Chip>
                  ))}
                </div>
                <a href={kakaoMapLinks(s.attraction.name, s.attraction.lat, s.attraction.lng).map} target="_blank" rel="noopener noreferrer" className={`${outLink} mt-auto inline-flex min-h-11 items-center text-[14px] font-bold`}>
                  카카오맵에서 보기
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
