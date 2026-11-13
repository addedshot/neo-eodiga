// 여행추천에 쓸 시군구별 대표 명소(content/attractions.json)와 붐빔 예측(content/attraction-crowd.json)을 만드는 스크립트
// 사용법: npm run build-attractions -- --sido 부산,울산,경남   (시도를 고르지 않으면 전국)
//         --max-calls 600  상세 정보 호출 수 한도(관광공사 개발 계정은 기능별 하루 한도가 있다. 기본 600)
// 1층 점수: 한국관광 100선 > 세계유산 > 사적·명승, 100대 명산 > 해수욕장 > 관광지 집중률 목록에 있음. 운영자 장소(places.json)는 항상 넣는다.
// 상세 정보는 고른 명소만, 수정 시각이 바뀐 것만 받는다. 한도에 걸리면 남은 것은 다음 실행에 받는다.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { distanceMeters, todayInKorea } from "../src/lib/festivals.ts";

const CONTENT = path.join(process.cwd(), "content");
const OUTPUT = path.join(CONTENT, "attractions.json");
const CROWD_OUTPUT = path.join(CONTENT, "attraction-crowd.json");
const API_BASE = "https://apis.data.go.kr/B551011/KorService2/";
const CROWD_API = "https://apis.data.go.kr/B551011/TatsCnctrRateService/tatsCnctrRatedList";
const PER_SIGUNGU = 10;
const CONTENT_TYPES = ["12", "14", "28"]; // 관광지, 문화시설, 레포츠
const ALLOWED_IMAGE_TYPES = new Set(["Type1", "Type3"]);
const SCORE = { top100: 100, unesco: 60, heritage: 40, mountain: 40, beach: 15, crowd: 20, image: 5, operator: 1000 };

type Item = Record<string, string | undefined>;
type Region = { code: string; sido: string; sigungu: string };
type Badge = "한국관광 100선" | "유네스코 세계유산" | "사적" | "명승" | "100대 명산" | "해수욕장" | "직접 가봄";
type Detail = {
  overview?: string;
  homepage?: string;
  phone?: string;
  useTime?: string;
  restDate?: string;
  fee?: string;
  parking?: string;
  babyCarriage?: string;
  pet?: string;
  expAge?: string;
  modifiedTime: string;
};
type Attraction = {
  id: string;
  name: string;
  contentTypeId: string;
  sido: string;
  sigungu: string;
  address?: string;
  lat: number;
  lng: number;
  group?: string; // 분류 대(자연관광, 역사관광 등)
  category?: string; // 분류 중(역사유적지, 해변 등)
  kind?: string; // 분류 소
  indoor: boolean;
  image?: { url: string; license: "Type1" | "Type3" };
  badges: Badge[];
  inCrowdList: boolean;
  score: number;
  modifiedTime: string;
  detail?: Detail;
};

function fail(message: string): never {
  console.error(`명소 자료를 만들지 못했어요. ${message} 기존 파일은 그대로 두었어요.`);
  process.exit(1);
}

const apiKey = process.env.TOUR_API_KEY?.trim();
if (!apiKey) fail("환경 변수 TOUR_API_KEY가 없어요.");
const arg = (name: string) => {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
};
const sidoFilter = arg("--sido")?.split(",").map((s) => s.trim()).filter(Boolean);
const maxDetailCalls = Number(arg("--max-calls") ?? 600);
let listCalls = 0;
let detailCalls = 0;

async function getJson(url: string): Promise<{ items: Item[]; total: number }> {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url);
      const body = await res.text();
      if (res.status === 429) throw Object.assign(new Error("HTTP 429 호출 한도 초과"), { limit: true });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = JSON.parse(body) as { response?: { header?: { resultCode?: string; resultMsg?: string }; body?: { items?: { item?: Item[] } | ""; totalCount?: number } } };
      const header = json.response?.header;
      if (header?.resultCode !== "0000") throw new Error(`결과 코드 ${header?.resultCode} ${header?.resultMsg ?? ""}`);
      const items = json.response?.body?.items;
      return { items: items && typeof items === "object" ? (items.item ?? []) : [], total: Number(json.response?.body?.totalCount ?? 0) };
    } catch (error) {
      if ((error as { limit?: boolean }).limit || attempt >= 3) throw error;
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
}

const tourUrl = (operation: string, params: Record<string, string>) =>
  `${API_BASE}${operation}?${new URLSearchParams({ serviceKey: apiKey!, MobileOS: "ETC", MobileApp: "neo-eodiga", _type: "json", ...params })}`;

// 이름 맞추기용으로 띄어쓰기, 괄호와 대괄호 안의 말, 기호를 뺀다. 예: "통도사 [유네스코 세계유산]" → "통도사"
const norm = (s: string) =>
  s
    .replace(/\[[^\]]*\]|\([^)]*\)|（[^）]*）/g, "")
    .replace(/[\s·ㆍ.,'"’‘“”&\-_/]/g, "")
    .toLowerCase();
const plain = (v?: string) =>
  v
    ?.replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n") || undefined;
const firstUrl = (v?: string) => v?.match(/https?:\/\/[^\s"'<>]+/)?.[0];

const regions = JSON.parse(readFileSync(path.join(CONTENT, "regions.json"), "utf8")) as Region[];
const byCode = new Map(regions.map((r) => [r.code, r]));
const targetRegions = regions.filter((r) => !sidoFilter || sidoFilter.includes(r.sido));
if (targetRegions.length === 0) fail(`--sido ${sidoFilter?.join(",")}에 맞는 시도가 없어요.`);
const targetSido = [...new Set(targetRegions.map((r) => r.sido))];

function findRegion(item: Item): Region | undefined {
  const signgu = item.lDongSignguCd ?? "";
  const code = signgu.length === 5 ? signgu : `${item.lDongRegnCd ?? ""}${signgu}`;
  return byCode.get(code) ?? byCode.get(`${code.slice(0, 4)}0`);
}

// 1. 분류 코드표(이름으로 바꾸기)
const classNames = new Map<string, { group: string; category: string; kind: string }>();
{
  const { items } = await getJson(tourUrl("lclsSystmCode2", { lclsSystmListYn: "Y", numOfRows: "1000", pageNo: "1" }));
  listCalls++;
  for (const i of items) classNames.set(i.lclsSystm3Cd ?? "", { group: i.lclsSystm1Nm ?? "", category: i.lclsSystm2Nm ?? "", kind: i.lclsSystm3Nm ?? "" });
}

// 2. 관광공사 목록(시도별, 분류별)
const sidoCodes = [...new Set(targetRegions.map((r) => r.code.slice(0, 2)))];
const listItems: Item[] = [];
for (const regn of sidoCodes) {
  for (const contentTypeId of CONTENT_TYPES) {
    for (let page = 1; ; page++) {
      const { items, total } = await getJson(tourUrl("areaBasedList2", { contentTypeId, lDongRegnCd: regn, arrange: "C", numOfRows: "1000", pageNo: String(page) }));
      listCalls++;
      listItems.push(...items);
      if (items.length === 0 || page * 1000 >= total) break;
    }
  }
}

// 3. 관광지 집중률 목록(시군구별 관광지 이름과 30일 집중률). 일반구가 있는 시는 구 코드로 부른다.
const crowd = new Map<string, Map<string, Record<string, number>>>(); // 시군구 code → 정규화 이름 → 날짜별 집중률
const crowdNames = new Map<string, Map<string, string>>(); // 시군구 code → 정규화 이름 → 원래 이름
let crowdCalls = 0;
async function crowdList(signguCd: string): Promise<Item[]> {
  crowdCalls++;
  const url = `${CROWD_API}?${new URLSearchParams({ serviceKey: apiKey!, MobileOS: "ETC", MobileApp: "neo-eodiga", _type: "json", areaCd: signguCd.slice(0, 2), signguCd, numOfRows: "10000", pageNo: "1" })}`;
  return (await getJson(url)).items;
}
for (const region of targetRegions) {
  let rows = await crowdList(region.code);
  if (rows.length === 0 && region.code.endsWith("0")) for (let d = 1; d <= 9; d += 2) rows = rows.concat(await crowdList(`${region.code.slice(0, 4)}${d}`));
  const names = new Map<string, string>();
  const rates = new Map<string, Record<string, number>>();
  for (const row of rows) {
    const name = row.tAtsNm ?? "";
    const key = norm(name);
    if (!key) continue;
    names.set(key, name);
    const date = row.baseYmd ?? "";
    const rate = Number(row.cnctrRate);
    if (/^\d{8}$/.test(date) && Number.isFinite(rate)) {
      const day = `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`;
      rates.set(key, { ...(rates.get(key) ?? {}), [day]: Math.round(rate) });
    }
  }
  crowdNames.set(region.code, names);
  crowd.set(region.code, rates);
}

// 4. 근거 자료
const reference = JSON.parse(readFileSync(path.join(CONTENT, "reference.json"), "utf8")) as {
  mountains: { name: string; lat: number; lng: number }[];
  unesco: { name: string; description: string }[];
  heritage: { kind: "사적" | "명승"; name: string; sido: string; sigungu: string; lat: number; lng: number }[];
};
const top100 = (JSON.parse(readFileSync(path.join(CONTENT, "korea-top100.json"), "utf8")) as { items: { sido: string; places: string[] }[] }).items;
const operatorPlaces = JSON.parse(readFileSync(path.join(CONTENT, "places.json"), "utf8")) as { name: string; sido: string; sigungu: string; lat?: number; lng?: number }[];

// 이름 앞의 지명(시도 이름, 시군구 이름에서 시·군·구를 뗀 말)을 뗀다. 예: 창녕군 "창녕우포늪" → "우포늪"
function stripPlacePrefix(key: string, region: Region): string {
  const stems = [norm(region.sigungu).replace(/[시군구]$/, ""), norm(region.sido)].filter((s) => s.length >= 2);
  for (const stem of stems) if (key.startsWith(stem) && key.length > stem.length + 1) return key.slice(stem.length);
  return key;
}
// 집중률 목록의 원래 이름(표시가 붙은 이름). 표시는 그 장소에만 붙이므로 이름이 같을 때만 찾는다.
const crowdOriginalName = (code: string, key: string) => crowdNames.get(code)?.get(key);

// 5. 후보 만들기와 근거 붙이기
const previous: Map<string, Attraction> = existsSync(OUTPUT)
  ? new Map((JSON.parse(readFileSync(OUTPUT, "utf8")) as { attractions: Attraction[] }).attractions.map((a) => [a.id, a]))
  : new Map();
const INDOOR_WORDS = /박물관|미술관|전시관|기념관|과학관|도서관|공연장|아쿠아리움|수족관|온천|찜질방|스파|실내|갤러리|영화관|체험관/;
const seen = new Set<string>();
const candidates: Attraction[] = [];
for (const item of listItems) {
  const id = item.contentid ?? "";
  const name = plain(item.title);
  const region = findRegion(item);
  const lat = Number(item.mapy);
  const lng = Number(item.mapx);
  if (!/^\d+$/.test(id) || !name || seen.has(id) || !region || !targetSido.includes(region.sido)) continue;
  if (!(lat > 33 && lat < 39 && lng > 124 && lng < 132)) continue;
  seen.add(id);
  const cls = classNames.get(item.lclsSystm3 ?? "");
  const key = norm(name);
  const badges: Badge[] = [];
  let score = 0;
  // 한국관광 100선: 같은 시도에서 이름이 같으면(앞의 지명은 뗀다. 예: "창녕 우포늪", "남해독일마을", "해운대 그린레일웨이")
  // 이름을 포함하기만 하는 곳("통도사 자장암", "태종대온천찜질방")은 붙이지 않는다.
  const bareKey = stripPlacePrefix(key, region);
  if (top100.some((t) => t.sido === region.sido && t.places.some((p) => bareKey === stripPlacePrefix(norm(p), region)))) {
    badges.push("한국관광 100선");
    score += SCORE.top100;
  }
  // 세계유산: 관광공사 집중률 목록의 이름에 "유네스코"가 붙어 있거나(예: "통도사 [유네스코 세계유산]"),
  // 세계유산 설명에 이름이 나오고 2km 안에 같은 이름이 들어간 사적이 있으면. 설명만으로는 같은 이름의 다른 절(부산 선암사 등)이 걸린다.
  const crowdOriginal = crowdOriginalName(region.code, key);
  const nearHeritageWithName = reference.heritage.some((h) => h.lat && norm(h.name).includes(key) && distanceMeters({ lat, lng }, h) <= 2000);
  if (/유네스코/.test(crowdOriginal ?? "") || (key.length >= 3 && nearHeritageWithName && reference.unesco.some((u) => norm(u.name).includes(key) || norm(u.description).includes(key)))) {
    badges.push("유네스코 세계유산");
    score += SCORE.unesco;
  }
  // 사적·명승: 이름이 맞고 2km 안(좌표가 없으면 같은 시군구)
  const heritage = reference.heritage.find((h) => {
    const hk = norm(h.name);
    const nameMatch = key.length >= 2 && (hk === key || hk.endsWith(key) || (hk.length >= 3 && key.includes(hk)));
    if (!nameMatch) return false;
    return h.lat ? distanceMeters({ lat, lng }, h) <= 2000 : h.sigungu === region.sigungu;
  });
  if (heritage) {
    badges.push(heritage.kind);
    score += SCORE.heritage;
  }
  // 100대 명산: 이름에 산 이름이 들어 있고 20km 안
  if (reference.mountains.some((m) => key.startsWith(norm(m.name)) && distanceMeters({ lat, lng }, m) <= 20000)) {
    badges.push("100대 명산");
    score += SCORE.mountain;
  }
  if (/해수욕장|해변$/.test(name)) {
    badges.push("해수욕장");
    score += SCORE.beach;
  }
  // 운영자가 다녀온 장소: 이름이 같고 300m 안(장소에 좌표가 없으면 같은 시군구)
  const isOperatorPlace = (p: (typeof operatorPlaces)[number]) =>
    norm(p.name) === key &&
    (p.lat !== undefined && p.lng !== undefined ? distanceMeters({ lat, lng }, { lat: p.lat, lng: p.lng }) <= 300 : p.sido === region.sido && p.sigungu === region.sigungu);
  if (operatorPlaces.some(isOperatorPlace)) {
    badges.push("직접 가봄");
    score += SCORE.operator;
  }
  const crowdKey = [...(crowdNames.get(region.code)?.keys() ?? [])].find((c) => c === key || (c.length >= 3 && (c.startsWith(key) || key.startsWith(c))));
  if (crowdKey) score += SCORE.crowd;
  const license = item.cpyrhtDivCd ?? "";
  const imageUrl = (item.firstimage ?? "").replace(/^http:\/\//, "https://");
  const image = imageUrl && ALLOWED_IMAGE_TYPES.has(license) ? { url: imageUrl, license: license as "Type1" | "Type3" } : undefined;
  if (image) score += SCORE.image;
  candidates.push({
    id,
    name,
    contentTypeId: item.contenttypeid ?? "",
    sido: region.sido,
    sigungu: region.sigungu,
    ...(plain([item.addr1, item.addr2].filter(Boolean).join(" ")) ? { address: plain([item.addr1, item.addr2].join(" ")) } : {}),
    lat: Number(lat.toFixed(6)),
    lng: Number(lng.toFixed(6)),
    ...(cls ? { group: cls.group, category: cls.category, kind: cls.kind } : {}),
    indoor: item.contenttypeid === "14" || INDOOR_WORDS.test(`${cls?.kind ?? ""} ${name}`),
    ...(image ? { image } : {}),
    badges,
    inCrowdList: Boolean(crowdKey),
    score,
    modifiedTime: item.modifiedtime ?? "",
    ...(crowdKey ? { crowdKey } : {}),
  } as Attraction & { crowdKey?: string });
}

// 6. 시군구마다 점수 순으로 고른다. 근거나 집중률 목록이 하나도 없는 곳은 고르지 않는다(운영자 장소는 예외).
const picked: (Attraction & { crowdKey?: string })[] = [];
for (const region of targetRegions) {
  const list = candidates
    .filter((c) => c.sido === region.sido && c.sigungu === region.sigungu && (c.badges.length > 0 || c.inCrowdList))
    .sort((a, b) => b.score - a.score || (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  // 같은 이름이 여러 개면 하나만
  const names = new Set<string>();
  for (const c of list) {
    if (names.has(norm(c.name))) continue;
    names.add(norm(c.name));
    picked.push(c);
    if (names.size === PER_SIGUNGU && !list.some((x) => x.badges.includes("직접 가봄") && !names.has(norm(x.name)))) break;
  }
}

// 7. 고른 명소의 상세 정보(이용 시간, 쉬는 날, 요금, 주차, 유모차, 반려동물, 소개). 수정 시각이 같으면 지난 값을 쓴다.
const INTRO_KEYS: Record<string, Record<keyof Omit<Detail, "overview" | "homepage" | "modifiedTime">, string>> = {
  "12": { phone: "infocenter", useTime: "usetime", restDate: "restdate", fee: "usefee", parking: "parking", babyCarriage: "chkbabycarriage", pet: "chkpet", expAge: "expagerange" },
  "14": { phone: "infocenterculture", useTime: "usetimeculture", restDate: "restdateculture", fee: "usefee", parking: "parkingculture", babyCarriage: "chkbabycarriageculture", pet: "chkpetculture", expAge: "expagerange" },
  "28": { phone: "infocenterleports", useTime: "usetimeleports", restDate: "restdateleports", fee: "usefeeleports", parking: "parkingleports", babyCarriage: "chkbabycarriageleports", pet: "chkpetleports", expAge: "expagerangeleports" },
};
let reused = 0;
let waiting = 0;
let limited = false;
for (const a of picked) {
  const old = previous.get(a.id)?.detail;
  if (old && old.modifiedTime === a.modifiedTime) {
    a.detail = old;
    reused++;
    continue;
  }
  if (limited || detailCalls + 2 > maxDetailCalls) {
    if (old) a.detail = old; // 바뀌었지만 이번에 못 받으면 지난 값이라도 쓴다
    waiting++;
    continue;
  }
  try {
    detailCalls += 2;
    const [common] = (await getJson(tourUrl("detailCommon2", { contentId: a.id }))).items;
    const [intro] = (await getJson(tourUrl("detailIntro2", { contentId: a.id, contentTypeId: a.contentTypeId }))).items;
    const keys = INTRO_KEYS[a.contentTypeId] ?? INTRO_KEYS["12"];
    const detail: Detail = { modifiedTime: a.modifiedTime };
    const overview = plain(common?.overview);
    if (overview) detail.overview = overview;
    const homepage = firstUrl(common?.homepage);
    if (homepage) detail.homepage = homepage;
    for (const [field, apiKeyName] of Object.entries(keys) as [keyof typeof keys, string][]) {
      const value = plain(intro?.[apiKeyName]) ?? (field === "phone" ? plain(common?.tel) : undefined);
      if (value) detail[field] = value;
    }
    a.detail = detail;
  } catch (error) {
    if ((error as { limit?: boolean }).limit) {
      limited = true;
      if (old) a.detail = old;
      waiting++;
      console.warn("관광공사 상세 정보 호출 한도에 걸렸어요. 남은 명소는 다음 실행에 받아요.");
    } else fail(`상세 정보를 받지 못했어요. (${(error as Error).message})`);
  }
}

// 8. 저장. 고르지 않은 시도의 지난 명소는 그대로 둔다.
const keep = [...previous.values()].filter((a) => !targetSido.includes(a.sido));
const sortKey = (a: Attraction) => `${a.sido}\u0000${a.sigungu}\u0000${String(10000 - a.score).padStart(5, "0")}\u0000${a.name}`;
const withoutCrowdKey = (a: Attraction & { crowdKey?: string }): Attraction => {
  const copy = { ...a };
  delete copy.crowdKey;
  return copy;
};
const attractions = [...keep, ...picked.map(withoutCrowdKey)].sort((a, b) => (sortKey(a) < sortKey(b) ? -1 : sortKey(a) > sortKey(b) ? 1 : 0));
const today = todayInKorea();
writeFileSync(
  OUTPUT,
  `${JSON.stringify(
    {
      fetchedOn: today,
      sources: {
        tour: "https://www.data.go.kr/data/15101578/openapi.do",
        crowd: "https://www.data.go.kr/data/15128555/openapi.do",
        reference: "content/reference.json, content/korea-top100.json",
      },
      attractions,
    },
    null,
    2,
  )}\n`,
  "utf8",
);
const oldCrowd = existsSync(CROWD_OUTPUT) ? (JSON.parse(readFileSync(CROWD_OUTPUT, "utf8")) as { crowd: Record<string, Record<string, number>> }).crowd : {};
const keepIds = new Set(keep.map((a) => a.id));
const crowdOut: Record<string, Record<string, number>> = Object.fromEntries(Object.entries(oldCrowd).filter(([id]) => keepIds.has(id)));
for (const a of picked) {
  const rates = a.crowdKey ? crowd.get(targetRegions.find((r) => r.sido === a.sido && r.sigungu === a.sigungu)!.code)?.get(a.crowdKey) : undefined;
  if (rates) crowdOut[a.id] = rates;
}
writeFileSync(CROWD_OUTPUT, `${JSON.stringify({ fetchedOn: today, crowd: Object.fromEntries(Object.entries(crowdOut).sort(([x], [y]) => (x < y ? -1 : 1))) }, null, 2)}\n`, "utf8");

const badgeCount: Record<string, number> = {};
for (const a of picked) for (const b of a.badges) badgeCount[b] = (badgeCount[b] ?? 0) + 1;
console.log(
  `content/attractions.json을 만들었어요. 대상 ${targetSido.join(", ")}, 후보 ${candidates.length}곳 중 ${picked.length}곳을 골랐어요. (목록 호출 ${listCalls}번, 집중률 호출 ${crowdCalls}번, 상세 호출 ${detailCalls}번, 상세 재사용 ${reused}곳, 다음에 받을 곳 ${waiting}곳)`,
);
console.log(`근거: ${Object.entries(badgeCount).map(([k, v]) => `${k} ${v}`).join(", ") || "없음"}`);
