// 여행추천 주소 쿼리(?from=&date=&with=&by=&to=)를 읽고 만드는 함수. 조건은 주소에만 담고 저장하지 않는다.
import { COMPANIONS, type Companion } from "@/lib/content";
import { addDays } from "@/lib/festivals";
import { DISTANCE_OPTIONS, TRAVEL_MODES, type TravelMode, type TripInput } from "@/lib/recommend";

// 날짜는 오늘부터 60일 안에서 고른다(예보는 16일 안만 있고, 그 뒤는 계절로 판단한다).
export const MAX_DAYS_AHEAD = 60;

type Params = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() || undefined;

export function parseTripInput(params: Params, regionCodes: Set<string>, today: string): { input?: TripInput; to?: string; problems: string[] } {
  const problems: string[] = [];
  const from = one(params.from);
  const date = one(params.date);
  const companion = one(params.with);
  const by = one(params.by);
  if (!from || !regionCodes.has(from)) problems.push("출발 지역을 골라 주세요.");
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date) || date < today || date > addDays(today, MAX_DAYS_AHEAD)) {
    problems.push(`날짜는 오늘부터 ${MAX_DAYS_AHEAD}일 안에서 골라 주세요.`);
  }
  if (!companion || !(COMPANIONS as readonly string[]).includes(companion)) problems.push("누구와 가는지 골라 주세요.");
  if (!by || !(by in TRAVEL_MODES)) problems.push("이동 수단을 골라 주세요.");
  const to = one(params.to);
  if (problems.length > 0) return { problems };
  const kmValue = Number(one(params.km));
  const km = (DISTANCE_OPTIONS as readonly number[]).includes(kmValue) ? kmValue : TRAVEL_MODES[by as TravelMode].radiusKm;
  return {
    input: { from: from!, date: date!, with: companion as Companion, by: by as TravelMode, km },
    ...(to && regionCodes.has(to) ? { to } : {}),
    problems,
  };
}

export function tripQuery(input: TripInput, extra: Record<string, string> = {}): string {
  return new URLSearchParams({ from: input.from, date: input.date, with: input.with, by: input.by, km: String(input.km), ...extra }).toString();
}

// 기본 날짜: 다가오는 토요일(오늘이 토요일이면 오늘)
export function nextSaturday(today: string): string {
  const day = new Date(`${today}T00:00:00Z`).getUTCDay();
  return addDays(today, (6 - day + 7) % 7);
}
