// 지역축제의 오늘 기준 상태(예정, 진행 중, 종료)와 보여줄 축제, 기간 표시를 정하는 함수
// 오늘 날짜를 인자로 받아 날짜를 바꿔 가며 시험할 수 있게 한다. scripts/build-festivals.ts도 Node로 직접 불러 쓰므로 다른 로컬 파일은 타입만 가져온다.
import type { Festival } from "@/lib/content";

// 끝난 뒤 이 날수까지만 "종료"로 보여주고 그 뒤에는 어디에서도 보이지 않게 한다.
export const KEEP_DAYS_AFTER_END = 3;

export type FestivalStatus = "예정" | "진행 중" | "종료";

// 한국 시간 기준 오늘(YYYY-MM-DD)
export function todayInKorea(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(now);
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// 보여주지 않을 축제(끝난 지 3일이 넘음)는 null이다.
export function festivalStatus(festival: Pick<Festival, "startDate" | "endDate">, today: string): FestivalStatus | null {
  if (today < festival.startDate) return "예정";
  if (today <= festival.endDate) return "진행 중";
  if (today <= addDays(festival.endDate, KEEP_DAYS_AFTER_END)) return "종료";
  return null;
}

export type ShownFestival = { festival: Festival; status: FestivalStatus };

// 지금 보여줄 축제. 진행 중과 예정은 시작일 순, 종료는 맨 뒤에 둔다.
export function visibleFestivals(festivals: Festival[], today: string): ShownFestival[] {
  const rank: Record<FestivalStatus, number> = { "진행 중": 0, 예정: 0, 종료: 1 };
  return festivals
    .flatMap((festival) => {
      const status = festivalStatus(festival, today);
      return status ? [{ festival, status }] : [];
    })
    .sort(
      (a, b) =>
        rank[a.status] - rank[b.status] ||
        a.festival.startDate.localeCompare(b.festival.startDate) ||
        a.festival.name.localeCompare(b.festival.name),
    );
}

// 오늘 이후에 시작하는 축제 중 가까운 순으로 count개(메인에 쓴다)
export function upcomingFestivals(festivals: Festival[], today: string, count: number): Festival[] {
  return festivals
    .filter((f) => f.startDate > today)
    .sort((a, b) => a.startDate.localeCompare(b.startDate) || a.name.localeCompare(b.name))
    .slice(0, count);
}

export function isOnDate(festival: Pick<Festival, "startDate" | "endDate">, date: string): boolean {
  return festival.startDate <= date && date <= festival.endDate;
}

// 기간 표시. 올해 안이면 연도를 빼고, 하루짜리는 한 날짜만 쓴다. 예: "11월 14일~16일", "11월 30일~12월 2일"
export function formatPeriod(festival: Pick<Festival, "startDate" | "endDate">, today: string): string {
  const [sy, sm, sd] = festival.startDate.split("-").map(Number);
  const [ey, em, ed] = festival.endDate.split("-").map(Number);
  const thisYear = Number(today.slice(0, 4));
  const showYear = sy !== thisYear || ey !== thisYear;
  const start = `${showYear ? `${sy}년 ` : ""}${sm}월 ${sd}일`;
  if (festival.startDate === festival.endDate) return start;
  if (sy !== ey) return `${start}~${ey}년 ${em}월 ${ed}일`;
  if (sm !== em) return `${start}~${em}월 ${ed}일`;
  return `${start}~${ed}일`;
}

// 두 좌표 사이의 거리(m). 축제 주변의 상설 행사를 찾을 때 쓴다.
export function distanceMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * 6371000 * Math.asin(Math.sqrt(h)));
}

// 930 → "930m", 1450 → "1.5km"
export function formatDistance(meters: number): string {
  return meters < 1000 ? `${meters}m` : `${(meters / 1000).toFixed(1)}km`;
}
