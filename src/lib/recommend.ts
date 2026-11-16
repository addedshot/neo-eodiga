// 여행추천 엔진. 출발 시군구, 날짜, 누구와, 이동수단으로 목적지 3곳과 당일 계획을 고른다(규칙으로만 조립하고 지어내지 않는다).
// 오늘 날짜와 날씨를 인자로 받는 순수 함수라 날짜를 바꿔 가며 시험할 수 있다.
import type { Attraction } from "@/lib/attractions";
import type { Companion, Festival } from "@/lib/content";
import { distanceMeters, isOnDate } from "@/lib/festivals";

export type TravelMode = "car" | "transit";
export const TRAVEL_MODES: Record<TravelMode, { label: string; radiusKm: number }> = {
  car: { label: "자가용", radiusKm: 150 },
  transit: { label: "대중교통", radiusKm: 100 },
};

export type TripInput = { from: string; date: string; with: Companion; by: TravelMode };
export type DayWeather = { summary: string; min: number; max: number; rainChance: number | null };
type Region = { code: string; sido: string; sigungu: string };

export type ScoredAttraction = { attraction: Attraction; score: number; reasons: string[]; crowd?: number };
export type Destination = {
  region: Region;
  distanceKm: number;
  score: number;
  reasons: string[];
  attractions: ScoredAttraction[]; // 그날 점수 순(쉬는 날인 곳은 빠짐)
  festivals: Festival[]; // 그날 열리는 축제
  weather?: DayWeather;
};

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

// 쉬는 날 글에서 그날 요일이 쉬는지 본다. "매주 월요일", "월요일 휴관"처럼 분명한 경우만 쉰다고 본다.
export function isClosedOn(restDate: string | undefined, date: string): boolean {
  if (!restDate || /연중무휴|없음|상시/.test(restDate)) return false;
  const wd = WEEKDAYS[new Date(`${date}T00:00:00Z`).getUTCDay()];
  return new RegExp(`매주\\s*${wd}요일|(^|[\\s,·/])${wd}요일\\s*(휴관|휴무|휴장)`).test(restDate) || restDate.trim() === `${wd}요일`;
}

// 외부활동 날씨. 예보가 없으면 계절만 본다.
export function weatherKind(w: DayWeather | undefined): "rain" | "hot" | "cold" | "good" | "unknown" {
  if (!w) return "unknown";
  if ((w.rainChance ?? 0) >= 60 || /비|눈|소나기|뇌우|우박/.test(w.summary)) return "rain";
  if (w.max >= 33) return "hot";
  if (w.max <= 3) return "cold";
  return "good";
}

const isOutdoor = (a: Attraction) => !a.indoor;
const kidFriendly = (a: Attraction) =>
  /가능|있음|대여/.test(a.detail?.babyCarriage ?? "") || a.group === "체험관광" || /박물관|과학관|체험관|아쿠아리움|동물원|수목원/.test(`${a.kind ?? ""} ${a.name}`);

// 명소 하나의 그날 점수와 이유. 쉬는 날이면 undefined.
export function scoreAttraction(a: Attraction, input: TripInput, weather: DayWeather | undefined, crowd: number | undefined): ScoredAttraction | undefined {
  if (isClosedOn(a.detail?.restDate, input.date)) return undefined;
  const reasons: string[] = [];
  let score = Math.min(a.score, 150) / 3; // 1층 점수(100선 100, 세계유산 60 등)를 줄여 쓴다
  for (const b of a.badges) if (b !== "해수욕장") reasons.push(b);
  const kind = weatherKind(weather);
  if (kind === "rain") score += isOutdoor(a) ? -30 : 15;
  else if (kind === "hot" || kind === "cold") score += isOutdoor(a) ? -10 : 5;
  else if (kind === "good" && isOutdoor(a)) score += 10;
  if (kind === "unknown") {
    const month = Number(input.date.slice(5, 7));
    if (a.badges.includes("해수욕장")) score += month >= 6 && month <= 8 ? 15 : month === 12 || month <= 2 ? -5 : 0;
  }
  if (crowd !== undefined) {
    if (crowd <= 40) {
      score += 8;
      reasons.push("덜 붐빔");
    } else if (crowd >= 85) {
      score -= 8;
      reasons.push("붐빔");
    }
  }
  if (input.with === "아이와" && kidFriendly(a)) {
    score += 10;
    reasons.push("아이와 가기 좋음");
  }
  return { attraction: a, score, reasons, crowd };
}

// 출발지에서 직선거리로 당일 범위 안에 있는 시군구(명소가 있는 곳만)
export function candidateRegions(input: TripInput, regions: Region[], centers: Record<string, { lat: number; lng: number }>, attractions: Attraction[]) {
  const from = centers[input.from];
  if (!from) return [];
  const withAttractions = new Set(attractions.map((a) => `${a.sido}/${a.sigungu}`));
  return regions
    .filter((r) => withAttractions.has(`${r.sido}/${r.sigungu}`) && centers[r.code])
    .map((r) => ({ region: r, distanceKm: Math.round(distanceMeters(from, centers[r.code]) / 1000) }))
    .filter((c) => c.distanceKm <= TRAVEL_MODES[input.by].radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

type RankContext = {
  regions: Region[];
  centers: Record<string, { lat: number; lng: number }>;
  attractions: Attraction[];
  crowd: Record<string, Record<string, number>>;
  festivals: Festival[];
  weatherByCode: Record<string, DayWeather | undefined>; // 시군구 code → 그날 예보(없으면 계절로 판단)
};

// 한 시군구의 그날 점수. 명소 상위 3곳 + 축제 - 거리
export function scoreDestination(region: Region, distanceKm: number, input: TripInput, ctx: RankContext): Destination | undefined {
  const weather = ctx.weatherByCode[region.code];
  const scored = ctx.attractions
    .filter((a) => a.sido === region.sido && a.sigungu === region.sigungu)
    .map((a) => scoreAttraction(a, input, weather, ctx.crowd[a.id]?.[input.date]))
    .filter((s): s is ScoredAttraction => s !== undefined)
    .sort((a, b) => b.score - a.score);
  if (scored.length < 2) return undefined;
  const festivals = ctx.festivals.filter((f) => f.sido === region.sido && f.sigungu === region.sigungu && isOnDate(f, input.date));
  const top = scored.slice(0, 3);
  // 거리는 4km마다 1점씩 뺀다(100km면 25점). 비 오는 날 먼 곳이 가까운 곳보다 앞서지 않게 한다.
  let score = top.reduce((sum, s) => sum + s.score, 0) + (festivals.length > 0 ? 25 : 0) - distanceKm / 4;
  if (!top.some((s) => s.attraction.foods?.length)) score -= 10;
  const reasons: string[] = [];
  if (festivals.length > 0) reasons.push(`축제: ${festivals[0].name}`);
  const badges = [...new Set(top.flatMap((s) => s.attraction.badges.filter((b) => b !== "해수욕장")))];
  reasons.push(...badges.slice(0, 2));
  const kind = weatherKind(weather);
  if (weather) reasons.push(`${weather.summary} ${weather.min}~${weather.max}°`);
  if (kind === "rain" && top.some((s) => s.attraction.indoor)) {
    reasons.push("실내 명소 있음");
    score += 5;
  }
  if (top.some((s) => s.reasons.includes("덜 붐빔"))) reasons.push("덜 붐빔");
  if (input.with === "아이와" && top.some((s) => s.reasons.includes("아이와 가기 좋음"))) reasons.push("아이와 가기 좋음");
  reasons.push(`직선거리 약 ${distanceKm}km`);
  return { region, distanceKm, score, reasons, attractions: scored, festivals, weather };
}

export function rankDestinations(input: TripInput, ctx: RankContext, count = 3): Destination[] {
  return candidateRegions(input, ctx.regions, ctx.centers, ctx.attractions)
    .map(({ region, distanceKm }) => scoreDestination(region, distanceKm, input, ctx))
    .filter((d): d is Destination => d !== undefined)
    .sort((a, b) => b.score - a.score || a.distanceKm - b.distanceKm)
    .slice(0, count);
}

// 당일 계획: 오전 명소 → 점심 → 오후 명소나 축제. 비가 오면 실내를 먼저, 대안을 함께 준다.
export type DayPlan = {
  morning: ScoredAttraction;
  lunch?: { from: Attraction; foods: NonNullable<Attraction["foods"]> };
  afternoon: { kind: "attraction"; item: ScoredAttraction } | { kind: "festival"; item: Festival };
  alternatives: ScoredAttraction[]; // 날씨가 바뀌거나 쉬는 경우의 대안
  weatherKind: ReturnType<typeof weatherKind>;
};

export function buildDayPlan(dest: Destination): DayPlan {
  const kind = weatherKind(dest.weather);
  const list = dest.attractions;
  // 비 오는 날은 실내 명소를 오전에, 맑은 날은 야외 명소를 오전에 둔다.
  const prefer = (s: ScoredAttraction) => (kind === "rain" ? s.attraction.indoor : !s.attraction.indoor);
  const morning = list.find(prefer) ?? list[0];
  const rest = list.filter((s) => s !== morning && s.attraction.name !== morning.attraction.name);
  const festival = dest.festivals[0];
  // 오후는 축제가 있으면 축제, 없으면 오전과 분류가 다른 명소를 먼저 고른다.
  const afternoonAttraction = rest.find((s) => s.attraction.category !== morning.attraction.category) ?? rest[0];
  const afternoon: DayPlan["afternoon"] = festival ? { kind: "festival", item: festival } : { kind: "attraction", item: afternoonAttraction };
  // 점심은 오전·오후 명소 근처 먹을 곳에서, 없으면 같은 시군구의 다른 명소 가운데 오전 명소와 가장 가까운 곳의 먹을 곳에서 고른다.
  const nearMorning = [...rest]
    .filter((s) => s.attraction.foods?.length)
    .sort((x, y) => distanceMeters(morning.attraction, x.attraction) - distanceMeters(morning.attraction, y.attraction))[0];
  const lunchFrom = [morning, afternoon.kind === "attraction" ? afternoon.item : undefined, nearMorning].find((s) => s?.attraction.foods?.length);
  const used = new Set([morning.attraction.id, afternoon.kind === "attraction" ? afternoon.item.attraction.id : ""]);
  const alternatives = rest.filter((s) => !used.has(s.attraction.id)).slice(0, 3);
  return {
    morning,
    ...(lunchFrom ? { lunch: { from: lunchFrom.attraction, foods: lunchFrom.attraction.foods! } } : {}),
    afternoon,
    alternatives,
    weatherKind: kind,
  };
}
