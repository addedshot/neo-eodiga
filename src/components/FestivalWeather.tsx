// 축제 기간 중 예보 범위(오늘부터 16일) 안의 날마다 예상 날씨를 보여준다. 출처(Open-Meteo, CC BY 4.0)를 함께 단다.
import type { Festival } from "@/lib/content";
import { addDays } from "@/lib/festivals";
import { formatDate } from "@/lib/format";
import { FORECAST_DAYS, getDailyForecast, type DailyForecast } from "@/lib/weather";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function dayLabel(date: string): string {
  const weekday = WEEKDAYS[new Date(`${date}T00:00:00Z`).getUTCDay()];
  return `${Number(date.slice(5, 7))}월 ${Number(date.slice(8))}일 (${weekday})`;
}

export async function FestivalWeather({ festival, today }: { festival: Festival; today: string }) {
  if (festival.lat === undefined || festival.lng === undefined) {
    return <p className="text-ink-muted">축제 장소의 좌표가 없어 예상 날씨를 보여줄 수 없어요.</p>;
  }
  const lastForecastDay = addDays(today, FORECAST_DAYS - 1);
  if (festival.startDate > lastForecastDay) {
    return (
      <p className="text-ink-muted">
        예보는 축제 {FORECAST_DAYS}일 전부터 볼 수 있어요. {formatDate(addDays(festival.startDate, -(FORECAST_DAYS - 1)))}부터 확인해 주세요.
      </p>
    );
  }

  let forecast: DailyForecast[];
  try {
    forecast = await getDailyForecast(festival.lat, festival.lng);
  } catch {
    return <p className="text-ink-muted">예상 날씨를 불러오지 못했어요. 잠시 뒤에 다시 확인해 주세요.</p>;
  }
  const days = forecast.filter((d) => d.date >= festival.startDate && d.date <= festival.endDate && d.date >= today);

  return (
    <>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2.5">
        {days.map((d) => (
          <li key={d.date} className="rounded-2xl border border-line bg-surface p-4">
            <p className="text-sm font-bold">{dayLabel(d.date)}</p>
            <p className="mt-1 text-lg font-extrabold">{d.summary}</p>
            <p className="text-sm text-ink-muted">
              {d.min}° / {d.max}°
              {d.rainChance !== null && <span> · 비 {d.rainChance}%</span>}
            </p>
          </li>
        ))}
      </ul>
      {festival.endDate > lastForecastDay && (
        <p className="mt-2 text-sm text-ink-muted">{formatDate(lastForecastDay)} 뒤의 날씨는 아직 예보가 없어요.</p>
      )}
      <p className="mt-3 text-xs text-ink-muted">
        날씨 자료{" "}
        <a href="https://open-meteo.com/" className="underline" target="_blank" rel="noopener noreferrer">
          Open-Meteo
        </a>{" "}
        (
        <a href="https://open-meteo.com/en/licence" className="underline" target="_blank" rel="noopener noreferrer">
          CC BY 4.0
        </a>
        ), 일별 예보를 한국어로 옮겨 보여줘요.
      </p>
    </>
  );
}
