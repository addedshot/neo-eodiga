// 식당·숙박의 공식 인증·지정 표시 색인(content/badge-index.json)을 만드는 스크립트
// 사용법: npm run build-badges   (모범음식점은 TOUR_API_KEY와 같은 공공데이터포털 키, 백년가게·호텔 등급은 키 없는 파일,
//         위생등급은 식품안전나라 키 FOOD_SAFETY_API_KEY. 위생등급 키가 없으면 위생등급만 빼고 만든다)
// 색인 열쇠는 "시도|시군구|이름"이다(src/lib/badges.ts의 badgeKey). 지정 취소·폐업한 곳은 넣지 않는다.
import { writeFileSync } from "node:fs";
import path from "node:path";
import { badgeKey, type RestaurantBadge } from "../src/lib/badges.ts";
import { todayInKorea } from "../src/lib/festivals.ts";

const OUTPUT = path.join(process.cwd(), "content", "badge-index.json");
const SOURCES = {
  modelRestaurant: "https://www.data.go.kr/data/15155052/openapi.do", // 행정안전부 모범음식점정보 조회서비스
  centuryShop: "https://www.data.go.kr/data/15132695/fileData.do", // 소상공인시장진흥공단 전국 백년가게 지정리스트
  hotelGrade: "https://www.data.go.kr/data/15118900/fileData.do", // 문화체육관광부 전국호텔현황(결정 등급)
  hygieneGrade: "https://www.foodsafetykorea.go.kr/api/newDatasetDetail.do?svc_no=C004", // 식약처 식품접객업소 위생등급 지정 현황
};

function fail(message: string): never {
  console.error(`인증·지정 표시 색인을 만들지 못했어요. ${message} 기존 파일은 그대로 두었어요.`);
  process.exit(1);
}

const apiKey = process.env.TOUR_API_KEY?.trim();
if (!apiKey) fail("환경 변수 TOUR_API_KEY가 없어요.");

// 공공데이터포털 파일 데이터는 파일 번호를 먼저 받은 뒤 내려받는다(누리집의 내려받기 버튼과 같은 순서).
async function downloadPortalFile(pageUrl: string): Promise<string> {
  const pk = pageUrl.match(/data\/(\d+)\//)?.[1];
  const page = await (await fetch(pageUrl)).text();
  const detailPk = page.match(/name="publicDataDetailPk" value="([^"]+)"/)?.[1];
  if (!pk || !detailPk) fail(`${pageUrl}에서 파일 정보를 찾지 못했어요.`);
  const info = await fetch("https://www.data.go.kr/tcs/dss/selectFileDataDownload.do", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "X-Requested-With": "XMLHttpRequest", Referer: pageUrl },
    body: new URLSearchParams({ publicDataDetailPk: detailPk, publicDataPk: pk, atchFileId: "", fileDetailSn: "1", publicDataTyCode: "PR0051" }),
  });
  const json = JSON.parse(await info.text()) as { atchFileId?: string | null };
  if (!json.atchFileId) fail(`${pageUrl}의 첨부 파일 번호를 받지 못했어요.`);
  const res = await fetch(`https://www.data.go.kr/cmm/cmm/fileDownload.do?atchFileId=${json.atchFileId}&fileDetailSn=1`);
  if (!res.ok) fail(`${pageUrl} 파일을 받지 못했어요. (HTTP ${res.status})`);
  const bytes = await res.arrayBuffer();
  const utf8 = new TextDecoder("utf-8").decode(bytes);
  return (utf8.includes("�") ? new TextDecoder("euc-kr").decode(bytes) : utf8).replace(/^﻿/, "");
}

// 따옴표 안의 쉼표를 지키는 CSV 읽기
function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else quoted = false;
      } else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n") {
      row.push(cell.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  if (cell || row.length) rows.push([...row, cell]);
  const [header, ...body] = rows;
  return body.filter((r) => r.length >= header.length).map((r) => Object.fromEntries(header.map((h, i) => [h.trim(), (r[i] ?? "").trim()])));
}

const restaurants: Record<string, RestaurantBadge[]> = {};
const addRestaurant = (key: string | undefined, badge: RestaurantBadge) => {
  if (!key) return false;
  const list = (restaurants[key] ??= []);
  if (!list.includes(badge)) list.push(badge);
  return true;
};

// 1. 모범음식점(행정안전부 API). 영업 중이고 지정 취소가 없는 곳만.
let modelTotal = 0;
let modelKept = 0;
for (let page = 1; ; page++) {
  const q = new URLSearchParams({ serviceKey: apiKey!, pageNo: String(page), numOfRows: "1000", returnType: "json" });
  let json: { response?: { body?: { totalCount?: number; items?: { item?: Record<string, string>[] } } } };
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(`https://apis.data.go.kr/1741000/excellent_restaurant_info/info?${q}`);
    const text = await res.text();
    try {
      if (!res.ok) throw new Error(`HTTP ${res.status} ${text.slice(0, 120)}`);
      json = JSON.parse(text);
      break;
    } catch (error) {
      if (attempt >= 3) fail(`모범음식점 API 호출에 실패했어요. (${(error as Error).message})`);
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
  const items = json.response?.body?.items?.item ?? [];
  modelTotal = Number(json.response?.body?.totalCount ?? 0);
  for (const r of items) {
    if (r.SALS_STTS_NM !== "영업" || r.DSGN_RTRCN_YMD || r.CLSBIZ_YMD) continue;
    if (addRestaurant(badgeKey(r.BSNSSP_NM ?? "", r.ROAD_NM_ADDR || r.LCTN_ADDR), "모범음식점")) modelKept++;
  }
  if (items.length === 0 || page * 1000 >= modelTotal) break;
}
if (modelKept < 1000) fail(`모범음식점이 ${modelKept}건뿐이에요.`);

// 2. 백년가게(음식점 외 업종도 있다. 화면에는 관광공사 음식점과 이름이 맞는 곳에만 붙는다)
const centuryRows = parseCsv(await downloadPortalFile(SOURCES.centuryShop));
let centuryKept = 0;
for (const r of centuryRows) if (addRestaurant(badgeKey(r["업체명"], r["업체주소"]), "백년가게")) centuryKept++;
if (centuryKept < 500) fail(`백년가게가 ${centuryKept}건뿐이에요.`);

// 3. 위생등급 지정(식품안전나라 C004). 영업 정상, 지정 취소 없음, 지정 기간 안, 음식점 업종만.
const foodSafetyKey = process.env.FOOD_SAFETY_API_KEY?.trim();
let hygieneKept = 0;
if (!foodSafetyKey) console.warn("FOOD_SAFETY_API_KEY가 없어 위생등급은 넣지 않아요.");
else {
  const today = todayInKorea().replace(/-/g, "");
  const FOOD_TYPES = new Set(["일반음식점", "휴게음식점", "제과점영업"]);
  for (let start = 1; ; start += 1000) {
    const res = await fetch(`http://openapi.foodsafetykorea.go.kr/api/${foodSafetyKey}/C004/json/${start}/${start + 999}`);
    const json = JSON.parse(await res.text()) as { C004?: { total_count?: string; row?: Record<string, string>[]; RESULT?: { CODE?: string; MSG?: string } } };
    const body = json.C004;
    if (!body?.row) {
      if (body?.RESULT?.CODE === "INFO-200") break; // 더 이상 자료 없음
      fail(`위생등급 API 호출에 실패했어요. (${body?.RESULT?.CODE ?? res.status} ${body?.RESULT?.MSG ?? ""})`);
    }
    for (const r of body.row) {
      if (r.CLSBIZ_DVS_CD_NM !== "정상" || r.ASGN_CANCEL_YMD || (r.ASGN_TO && r.ASGN_TO < today) || !FOOD_TYPES.has(r.INDUTY_NM)) continue;
      if (addRestaurant(badgeKey(r.BSSH_NM ?? "", r.ADDR), "위생등급 지정")) hygieneKept++;
    }
    if (start + 999 >= Number(body.total_count ?? 0)) break;
  }
  if (hygieneKept < 10000) fail(`위생등급이 ${hygieneKept}건뿐이에요.`);
}

// 4. 호텔 등급(관광호텔업 결정 등급)
const hotelRows = parseCsv(await downloadPortalFile(SOURCES.hotelGrade));
const hotels: Record<string, string> = {};
for (const r of hotelRows) {
  const key = badgeKey(r["호텔명"], r["주소"]);
  const grade = r["결정 등급"];
  if (key && /^[1-5]성$/.test(grade)) hotels[key] = grade;
}
if (Object.keys(hotels).length < 300) fail(`호텔 등급이 ${Object.keys(hotels).length}건뿐이에요.`);

const sortObject = <T>(o: Record<string, T>) => Object.fromEntries(Object.entries(o).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
writeFileSync(OUTPUT, `${JSON.stringify({ fetchedOn: todayInKorea(), sources: SOURCES, restaurants: sortObject(restaurants), hotels: sortObject(hotels) })}\n`, "utf8");
console.log(
  `content/badge-index.json을 만들었어요. 모범음식점 ${modelKept}건(전체 ${modelTotal}건 중 영업·지정 유지), 백년가게 ${centuryKept}건, 위생등급 지정 ${hygieneKept}건, 호텔 등급 ${Object.keys(hotels).length}건.`,
);
