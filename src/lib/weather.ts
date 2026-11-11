// 축제 장소의 일별 예상 날씨를 Open-Meteo에서 받는 함수(가입 없음, 비상업용 무료, 자료는 CC BY 4.0이라 화면에 출처를 단다)
import { cacheLife } from "next/cache";

// Open-Meteo는 오늘부터 최대 16일치 일별 예보를 준다.
export const FORECAST_DAYS = 16;

export type DailyForecast = {
  date: string; // YYYY-MM-DD
  summary: string; // 예: "맑음"
  min: number; // 최저 기온(°C)
  max: number; // 최고 기온(°C)
  rainChance: number | null; // 강수 확률(%)
};

// WMO 날씨 코드 → 한국어 요약(https://open-meteo.com/en/docs 의 WMO Weather interpretation codes)
const WEATHER_NAMES: Record<number, string> = {
  0: "맑음",
  1: "대체로 맑음",
  2: "구름 조금",
  3: "흐림",
  45: "안개",
  48: "안개",
  51: "이슬비",
  53: "이슬비",
  55: "이슬비",
  56: "어는 이슬비",
  57: "어는 이슬비",
  61: "비",
  63: "비",
  65: "강한 비",
  66: "어는 비",
  67: "어는 비",
  71: "눈",
  73: "눈",
  75: "많은 눈",
  77: "싸락눈",
  80: "소나기",
  81: "소나기",
  82: "강한 소나기",
  85: "눈 소나기",
  86: "눈 소나기",
  95: "뇌우",
  96: "우박 동반 뇌우",
  99: "우박 동반 뇌우",
};

type OpenMeteoDaily = {
  time: string[];
  weather_code: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  precipitation_probability_max: (number | null)[];
};

// 같은 좌표의 예보는 한 시간 동안 다시 쓴다. 받기에 실패하면 오류를 던져 캐시에 남지 않게 한다.
export async function getDailyForecast(lat: number, lng: number): Promise<DailyForecast[]> {
  "use cache";
  cacheLife("hours");
  const query = new URLSearchParams({
    latitude: lat.toFixed(4),
    longitude: lng.toFixed(4),
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
    timezone: "Asia/Seoul",
    forecast_days: String(FORECAST_DAYS),
  });
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${query}`);
  if (!res.ok) throw new Error(`예상 날씨를 받지 못했어요. (HTTP ${res.status})`);
  const { daily } = (await res.json()) as { daily: OpenMeteoDaily };
  return daily.time.map((date, i) => ({
    date,
    summary: WEATHER_NAMES[daily.weather_code[i]] ?? "알 수 없음",
    min: Math.round(daily.temperature_2m_min[i]),
    max: Math.round(daily.temperature_2m_max[i]),
    rainChance: daily.precipitation_probability_max[i],
  }));
}
