// 행사·명소 글에서 운영 요일을 읽는 함수. "매주 토요일", "화요일~일요일", "주말", "월요일 휴무" 같은 분명한 표현만 읽는다.
// 읽지 못하면 undefined를 돌려주고, 부르는 쪽은 "날짜별 일정 확인 필요"로 다룬다. 다른 로컬 파일을 import하지 않는다.

const DAYS = ["일", "월", "화", "수", "목", "금", "토"];
const DAY = "[월화수목금토일]";
const CLOSED_WORDS = /^\s*(은|는|에는)?\s*(휴무|휴관|휴장|휴업|정기\s*휴무|쉽니다|쉼|제외|미운영|운영\s*안\s*함)/;

export type Weekdays = {
  open: number[]; // 여는 요일(0=일요일). 비어 있으면 매일
  closed: number[]; // 쉬는 요일
  label: string; // 화면 표시. 예: "매주 토요일", "화~일요일", "월요일 휴무"
};

const dayIndex = (d: string) => DAYS.indexOf(d);
const sortDays = (days: Iterable<number>) => [...new Set(days)].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7)); // 월요일부터
const dayNames = (days: number[]) => days.map((d) => DAYS[d]).join("·");

// "토·일요일", "토, 일요일", "토요일과 일요일" 같은 묶음에서 요일들을 꺼낸다.
// "요일"의 "일"을 일요일로 읽지 않도록 "요일"을 먼저 지운다.
function daysIn(group: string): number[] {
  return [...group.replace(/요일/g, " ").matchAll(new RegExp(DAY, "g"))].map((m) => dayIndex(m[0]));
}

// 여는 요일이 한 주 안에서 이어져 있으면(일요일을 넘어가도) "화~일요일"처럼, 아니면 "매주 금·토요일"처럼 쓴다.
function openLabel(days: number[]): string {
  if (days.length >= 3) {
    const set = new Set(days);
    const start = days.find((d) => !set.has((d + 6) % 7));
    if (start !== undefined) {
      let end = start;
      let count = 1;
      while (set.has((end + 1) % 7) && count < days.length) {
        end = (end + 1) % 7;
        count++;
      }
      if (count === days.length) return `${DAYS[start]}~${DAYS[end]}요일`;
    }
  }
  return `매주 ${dayNames(days)}요일`;
}

export function readWeekdays(...texts: (string | undefined)[]): Weekdays | undefined {
  const text = texts.filter(Boolean).join("\n");
  if (!text) return undefined;
  const open = new Set<number>();
  const closed = new Set<number>();
  // 1. 범위: "화요일~일요일", "화~일요일"
  for (const m of text.matchAll(new RegExp(`(${DAY})(?:요일)?\\s*[~\\-–]\\s*(${DAY})요일`, "g"))) {
    const after = text.slice((m.index ?? 0) + m[0].length);
    if (CLOSED_WORDS.test(after)) continue;
    let d = dayIndex(m[1]);
    const end = dayIndex(m[2]);
    for (let n = 0; n < 7; n++) {
      open.add(d);
      if (d === end) break;
      d = (d + 1) % 7;
    }
  }
  // 2. "매주 토요일", "매주 토·일요일", "매주 금, 토요일"
  for (const m of text.matchAll(new RegExp(`매주\\s*((?:${DAY}\\s*(?:요일)?\\s*[·,/및과와\\s]*)+)`, "g"))) {
    const after = text.slice((m.index ?? 0) + m[0].length);
    const days = daysIn(m[1]);
    if (days.length === 0) continue;
    if (CLOSED_WORDS.test(after)) days.forEach((d) => closed.add(d));
    else days.forEach((d) => open.add(d));
  }
  // 3. "월요일 휴무", "월요일은 휴관"
  for (const m of text.matchAll(new RegExp(`(${DAY})요일\\s*(?:은|는|에는)?\\s*(?:휴무|휴관|휴장|휴업)`, "g"))) closed.add(dayIndex(m[1]));
  // 4. "주말(에만)" 운영
  if (open.size === 0 && /주말(에만|에\s*운영|\s*운영|\s*공연|\s*개최)/.test(text)) [0, 6].forEach((d) => open.add(d));

  const openDays = sortDays([...open].filter((d) => !closed.has(d)));
  const closedDays = sortDays(closed);
  if (openDays.length === 0 && closedDays.length === 0) return undefined;
  if (openDays.length === 7) return undefined;
  let label: string;
  if (openDays.length > 0) label = openLabel(openDays);
  else label = `${dayNames(closedDays)}요일 휴무`;
  return { open: openDays, closed: closedDays, label };
}

// 그날 여는지. 요일을 모르면 undefined.
export function isOpenOnDate(weekdays: Weekdays | undefined, date: string): boolean | undefined {
  if (!weekdays) return undefined;
  const day = new Date(`${date}T00:00:00Z`).getUTCDay();
  if (weekdays.closed.includes(day)) return false;
  if (weekdays.open.length > 0) return weekdays.open.includes(day);
  return true;
}
