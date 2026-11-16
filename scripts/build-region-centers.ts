// 시군구마다 대표 좌표 하나(content/region-centers.json)를 만드는 스크립트. 여행추천의 출발지·목적지 직선거리에 쓴다.
// 사용법: npm run build-region-centers
// 공식 시군구 중심 좌표 자료를 찾지 못해, 관광공사 관광지 좌표의 가운데 값(위도·경도 각각의 중앙값)을 쓴다. 대략의 위치다.
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { todayInKorea } from "../src/lib/festivals.ts";

const CONTENT = path.join(process.cwd(), "content");
const API_BASE = "https://apis.data.go.kr/B551011/KorService2/";

function fail(message: string): never {
  console.error(`시군구 대표 좌표를 만들지 못했어요. ${message} 기존 파일은 그대로 두었어요.`);
  process.exit(1);
}

const apiKey = process.env.TOUR_API_KEY?.trim();
if (!apiKey) fail("환경 변수 TOUR_API_KEY가 없어요.");

type Item = Record<string, string | undefined>;
const regions = JSON.parse(readFileSync(path.join(CONTENT, "regions.json"), "utf8")) as { code: string; sido: string; sigungu: string }[];
const byCode = new Map(regions.map((r) => [r.code, r]));
const findCode = (item: Item) => {
  const signgu = item.lDongSignguCd ?? "";
  const code = signgu.length === 5 ? signgu : `${item.lDongRegnCd ?? ""}${signgu}`;
  return byCode.has(code) ? code : byCode.has(`${code.slice(0, 4)}0`) ? `${code.slice(0, 4)}0` : undefined;
};

const points = new Map<string, { lat: number[]; lng: number[] }>();
let calls = 0;
// 세종은 관광공사 자료에서 시도 코드가 다섯 자리(36110)다.
for (const regn of [...new Set(regions.map((r) => (r.sido === "세종" ? r.code : r.code.slice(0, 2))))]) {
  for (let page = 1; ; page++) {
    const query = new URLSearchParams({ serviceKey: apiKey!, MobileOS: "ETC", MobileApp: "neo-eodiga", _type: "json", contentTypeId: "12", lDongRegnCd: regn, arrange: "C", numOfRows: "1000", pageNo: String(page) });
    calls++;
    const res = await fetch(`${API_BASE}areaBasedList2?${query}`);
    if (!res.ok) fail(`관광공사 목록 호출에 실패했어요. (HTTP ${res.status})`);
    const json = JSON.parse(await res.text()) as { response?: { body?: { totalCount?: number; items?: { item?: Item[] } | "" } } };
    const body = json.response?.body;
    const items = body?.items && typeof body.items === "object" ? (body.items.item ?? []) : [];
    for (const item of items) {
      const code = findCode(item);
      const lat = Number(item.mapy);
      const lng = Number(item.mapx);
      if (!code || !(lat > 33 && lat < 39 && lng > 124 && lng < 132)) continue;
      const p = points.get(code) ?? { lat: [], lng: [] };
      p.lat.push(lat);
      p.lng.push(lng);
      points.set(code, p);
    }
    if (items.length === 0 || page * 1000 >= Number(body?.totalCount ?? 0)) break;
  }
}

const median = (values: number[]) => {
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};
const centers: Record<string, { lat: number; lng: number; samples: number }> = {};
for (const r of regions) {
  const p = points.get(r.code);
  if (p) centers[r.code] = { lat: Number(median(p.lat).toFixed(5)), lng: Number(median(p.lng).toFixed(5)), samples: p.lat.length };
}
const missing = regions.filter((r) => !centers[r.code]).map((r) => `${r.sido} ${r.sigungu}`);
if (missing.length > 10) fail(`좌표를 만들지 못한 시군구가 ${missing.length}곳이에요.`);
writeFileSync(
  path.join(CONTENT, "region-centers.json"),
  `${JSON.stringify({ fetchedOn: todayInKorea(), method: "관광공사 관광지 좌표의 중앙값(대략의 위치)", centers }, null, 2)}\n`,
  "utf8",
);
console.log(`content/region-centers.json을 만들었어요. 시군구 ${Object.keys(centers).length}/${regions.length}곳 (목록 호출 ${calls}번)${missing.length ? `, 없는 곳: ${missing.join(", ")}` : ""}`);
