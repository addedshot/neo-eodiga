// 명소·축제 근처 먹을 곳의 상세(대표 메뉴, 취급 메뉴, 영업 시간, 쉬는 날, 주차, 포장, 예약, 인허가번호)를 받아 content/food-details.json에 모으는 스크립트
// 사용법: npm run build-food-details -- --max-calls 500   (관광공사 상세 기능의 하루 한도가 있어 나눠 받는다. 이미 받은 곳은 다시 받지 않는다)
// 순서: build-attractions·build-festivals(먹을 곳 id) → build-food-details → build-badges(인허가번호 색인) → build-attractions·build-festivals --max-calls 0(표시 다시 붙이기)
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { todayInKorea } from "../src/lib/festivals.ts";

const CONTENT = path.join(process.cwd(), "content");
const OUTPUT = path.join(CONTENT, "food-details.json");
const API = "https://apis.data.go.kr/B551011/KorService2/detailIntro2";

type FoodDetail = {
  firstMenu?: string;
  treatMenu?: string;
  openTime?: string;
  restDate?: string;
  parking?: string;
  packing?: string;
  reservation?: string;
  kidsFacility?: boolean;
  licenseNo?: string;
  fetchedOn: string;
};

function fail(message: string): never {
  console.error(`먹을 곳 상세를 받지 못했어요. ${message}`);
  process.exit(1);
}

const apiKey = process.env.TOUR_API_KEY?.trim();
if (!apiKey) fail("환경 변수 TOUR_API_KEY가 없어요.");
const i = process.argv.indexOf("--max-calls");
const maxCalls = i >= 0 ? Number(process.argv[i + 1]) : 500;

const plain = (v?: string) =>
  v
    ?.replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim() || undefined;

// 명소와 축제 파일에서 먹을 곳 id를 모은다.
const ids = new Set<string>();
const attractions = JSON.parse(readFileSync(path.join(CONTENT, "attractions.json"), "utf8")) as { attractions: { foods?: { id?: string }[] }[] };
for (const a of attractions.attractions) for (const f of a.foods ?? []) if (f.id) ids.add(f.id);
const festivals = JSON.parse(readFileSync(path.join(CONTENT, "festivals.json"), "utf8")) as { festivals: { foods?: { id?: string }[] }[] };
for (const fe of festivals.festivals) for (const f of fe.foods ?? []) if (f.id) ids.add(f.id);

const previous: Record<string, FoodDetail> = existsSync(OUTPUT) ? (JSON.parse(readFileSync(OUTPUT, "utf8")) as { details: Record<string, FoodDetail> }).details : {};
// 쓰이지 않는 곳은 지우고, 받은 지 90일이 지난 곳은 다시 받는다.
const today = todayInKorea();
const stale = (d: FoodDetail) => (Date.parse(today) - Date.parse(d.fetchedOn)) / 86400000 > 90;
const details: Record<string, FoodDetail> = Object.fromEntries(Object.entries(previous).filter(([id, d]) => ids.has(id) && !stale(d)));
const missing = [...ids].filter((id) => !details[id]);

let calls = 0;
let limited = false;
for (const id of missing) {
  if (calls >= maxCalls) break;
  calls++;
  const query = new URLSearchParams({ serviceKey: apiKey!, MobileOS: "ETC", MobileApp: "neo-eodiga", _type: "json", contentId: id, contentTypeId: "39" });
  const res = await fetch(`${API}?${query}`, { signal: AbortSignal.timeout(60_000) });
  if (res.status === 429) {
    limited = true;
    console.warn("관광공사 상세 기능 하루 한도에 걸렸어요. 남은 곳은 다음 실행에 받아요.");
    break;
  }
  const json = JSON.parse(await res.text()) as { response?: { header?: { resultCode?: string }; body?: { items?: { item?: Record<string, string>[] } | "" } } };
  if (json.response?.header?.resultCode !== "0000") fail(`결과 코드 ${json.response?.header?.resultCode}`);
  const items = json.response?.body?.items;
  const it = items && typeof items === "object" ? items.item?.[0] : undefined;
  const detail: FoodDetail = { fetchedOn: today };
  const set = (key: keyof FoodDetail, value?: string) => {
    if (value) (detail as Record<string, unknown>)[key] = value;
  };
  set("firstMenu", plain(it?.firstmenu));
  set("treatMenu", plain(it?.treatmenu));
  set("openTime", plain(it?.opentimefood));
  set("restDate", plain(it?.restdatefood));
  set("parking", plain(it?.parkingfood));
  set("packing", plain(it?.packing));
  set("reservation", plain(it?.reservationfood));
  if (it?.kidsfacility === "1") detail.kidsFacility = true;
  if (/^\d{8,}$/.test(it?.lcnsno ?? "")) detail.licenseNo = it!.lcnsno;
  details[id] = detail;
}

const sorted = Object.fromEntries(Object.entries(details).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
writeFileSync(OUTPUT, `${JSON.stringify({ fetchedOn: today, details: sorted }, null, 2)}\n`, "utf8");
const left = [...ids].filter((id) => !sorted[id]).length;
console.log(`content/food-details.json을 저장했어요. 먹을 곳 ${ids.size}곳 중 ${Object.keys(sorted).length}곳 상세, 이번 호출 ${calls}번, 남은 곳 ${left}곳${limited ? "(한도)" : ""}.`);
