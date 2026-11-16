// 여행추천을 요청 때 계산하는 서버 함수. 자료를 읽고, 후보 시군구의 예보를 받아 엔진(recommend.ts)에 넘긴다.
import { loadAttractionData } from "@/lib/attractions";
import { loadContent } from "@/lib/content";
import { addDays, festivalStatus } from "@/lib/festivals";
import { buildDayPlan, candidateRegions, rankDestinations, scoreDestination, type DayWeather, type TripInput } from "@/lib/recommend";
import { FORECAST_DAYS, getDailyForecast } from "@/lib/weather";

// 예보를 받을 시군구 수. 날씨 없이 먼저 점수를 매긴 뒤 상위 몇 곳만 받는다(요청 수를 줄인다).
const WEATHER_CANDIDATES = 8;

function baseContext(today: string) {
  const { regions, festivals } = loadContent();
  const { attractions, crowd, centers } = loadAttractionData();
  // 끝난 지 3일이 넘은 축제는 쓰지 않는다.
  const shownFestivals = festivals.filter((f) => festivalStatus(f, today) !== null);
  return { regions, centers, attractions, crowd, festivals: shownFestivals };
}

async function weatherFor(codes: string[], date: string, today: string, centers: Record<string, { lat: number; lng: number }>) {
  const weatherByCode: Record<string, DayWeather | undefined> = {};
  if (date > addDays(today, FORECAST_DAYS - 1)) return weatherByCode; // 예보 범위 밖이면 계절로 판단한다
  await Promise.all(
    codes.map(async (code) => {
      try {
        const forecast = await getDailyForecast(centers[code].lat, centers[code].lng);
        const day = forecast.find((d) => d.date === date);
        if (day) weatherByCode[code] = { summary: day.summary, min: day.min, max: day.max, rainChance: day.rainChance };
      } catch {
        // 예보를 받지 못하면 그 지역은 날씨 없이 판단한다.
      }
    }),
  );
  return weatherByCode;
}

export async function recommendDestinations(input: TripInput, today: string) {
  const base = baseContext(today);
  // 1차: 날씨 없이 점수를 매겨 상위 후보를 고른다.
  const first = rankDestinations(input, { ...base, weatherByCode: {} }, WEATHER_CANDIDATES);
  const weatherByCode = await weatherFor(
    first.map((d) => d.region.code),
    input.date,
    today,
    base.centers,
  );
  // 2차: 예보를 넣어 다시 점수를 매긴다(후보는 1차 상위로 한정).
  const firstCodes = new Set(first.map((d) => d.region.code));
  const destinations = rankDestinations(input, { ...base, regions: base.regions.filter((r) => firstCodes.has(r.code)), weatherByCode });
  const reachable = candidateRegions(input, base.regions, base.centers, base.attractions).length;
  const coveredSido = [...new Set(base.attractions.map((a) => a.sido))];
  return { destinations, reachable, coveredSido, forecastAvailable: Object.keys(weatherByCode).length > 0 };
}

export async function recommendPlan(input: TripInput, to: string, today: string) {
  const base = baseContext(today);
  const candidate = candidateRegions(input, base.regions, base.centers, base.attractions).find((c) => c.region.code === to);
  if (!candidate) return undefined;
  const weatherByCode = await weatherFor([to], input.date, today, base.centers);
  const destination = scoreDestination(candidate.region, candidate.distanceKm, input, { ...base, weatherByCode });
  if (!destination) return undefined;
  const from = base.regions.find((r) => r.code === input.from)!;
  return { destination, plan: buildDayPlan(destination), from, fromCenter: base.centers[input.from] };
}
