// 지역축제 월 달력(날짜마다 그날 열리는 축제 수, 누르면 아래 목록이 그날 축제로 좁혀진다)
import Link from "next/link";
import { isOnDate, type ShownFestival } from "@/lib/festivals";

type Props = {
  month: string; // YYYY-MM
  today: string; // YYYY-MM-DD
  selectedDate?: string;
  items: ShownFestival[];
  hrefFor: (date: string | undefined) => string;
};

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export function FestivalCalendar({ month, today, selectedDate, items, hrefFor }: Props) {
  const [year, mon] = month.split("-").map(Number);
  const firstWeekday = new Date(Date.UTC(year, mon - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, mon, 0)).getUTCDate();
  const cells: (string | null)[] = [
    ...Array<null>(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => `${month}-${String(i + 1).padStart(2, "0")}`),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks = Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7));

  return (
    <table className="w-full table-fixed border-collapse text-center">
      <caption className="sr-only">
        {year}년 {mon}월 지역축제 달력. 날짜를 고르면 그날 열리는 축제만 아래 목록에 나와요.
      </caption>
      <thead>
        <tr>
          {WEEKDAYS.map((day) => (
            <th key={day} scope="col" className="pb-2 text-sm font-medium text-ink-muted">
              {day}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {weeks.map((week, w) => (
          <tr key={w}>
            {week.map((date, d) => {
              if (!date) return <td key={d} className="p-px sm:p-0.5" />;
              const count = items.filter(({ festival }) => isOnDate(festival, date)).length;
              const day = Number(date.slice(8));
              const selected = date === selectedDate;
              const isToday = date === today;
              const label = `${mon}월 ${day}일${isToday ? "(오늘)" : ""}, 축제 ${count}개`;
              const body = (
                <>
                  <span className={isToday && !selected ? "font-extrabold text-link" : ""}>{day}</span>
                  <span className={`text-xs ${count > 0 ? "font-bold" : "invisible"}`}>{count}개</span>
                </>
              );
              const base = "flex min-h-14 flex-col items-center justify-center rounded-xl text-[15px]";
              return (
                <td key={d} className="p-px sm:p-0.5">
                  {count > 0 ? (
                    <Link
                      href={hrefFor(selected ? undefined : date)}
                      scroll={false}
                      aria-label={label}
                      aria-current={selected ? "date" : undefined}
                      className={`${base} ${
                        selected
                          ? "bg-primary text-white"
                          : "bg-surface-accent text-ink hover:outline hover:outline-1 hover:outline-primary"
                      }`}
                    >
                      {body}
                    </Link>
                  ) : (
                    <span className={`${base} text-ink-muted`}>
                      {body}
                    </span>
                  )}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
