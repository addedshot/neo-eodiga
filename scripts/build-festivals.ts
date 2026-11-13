// 한국관광공사 "국문 관광정보 서비스_GW"(TourAPI)로 지역축제 목록(content/festivals.json)을 만드는 스크립트
// 사용법: npm run build-festivals            (자동 갱신은 .github/workflows/update-festivals.yml이 주 1회 실행한다)
//         npm run build-festivals -- --refresh (지난 파일의 상세 내용을 다시 쓰지 않고 모두 새로 받는다)
// 주의: 개발 계정은 하루 호출 한도가 있다(2026-11-13 하루에 약 2,000번 부른 뒤 HTTP 429). --refresh는 한 번에 700번 넘게 부르므로 꼭 필요할 때만 쓴다.
// 인증키는 환경 변수 TOUR_API_KEY(로컬은 .env.local, GitHub는 Secrets)에서 읽는다. 키 값은 화면에 찍지 않는다.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { badgeKey } from "../src/lib/badges.ts";
import { addDays, distanceMeters, KEEP_DAYS_AFTER_END, todayInKorea } from "../src/lib/festivals.ts";

const SOURCE_URL = "https://www.data.go.kr/data/15101578/openapi.do";
const API_BASE = "https://apis.data.go.kr/B551011/KorService2/";
const OUTPUT = path.join(process.cwd(), "content", "festivals.json");
const LODGING_RADIUS_M = 2000;
const LODGING_COUNT = 5;
// 주변 정보: 먹을 곳과 볼거리는 2km 안 3곳, 주차장은 1km 안 3곳
const NEARBY_RADIUS_M = 2000;
const NEARBY_COUNT = 3;
const PARKING_RADIUS_M = 1000;
const PARKING_COUNT = 3;
const PARKING_DATASET_PK = "15012896"; // 공공데이터포털 전국주차장정보표준데이터(인증키 없음)
const PARKING_SOURCE_URL = `https://www.data.go.kr/data/${PARKING_DATASET_PK}/standard.do`;
// 공공누리 1유형(출처표시), 3유형(출처표시, 변경금지) 사진만 쓴다.
const ALLOWED_IMAGE_TYPES = new Set(["Type1", "Type3"]);
// 이 말이 들어간 문장을 예약 안내 근거로 보여준다.
// "티켓"만으로는 찾지 않는다("펫티켓", "티켓 소지 시 무료" 같은 문장이 걸린다).
const BOOKING_WORDS = ["예약", "예매", "사전 신청", "사전신청", "사전 접수", "사전접수", "선착순", "티켓제", "입장권"];

// 주소의 시도 이름(옛 이름 포함) → regions.json의 짧은 이름. 법정동 코드로 찾지 못했을 때만 쓴다.
const SIDO_SHORT: Record<string, string> = {
  서울특별시: "서울", 서울시: "서울", 서울: "서울",
  전남광주통합특별시: "전남광주", 전라남도: "전남광주", 광주광역시: "전남광주", 전남: "전남광주", 광주: "전남광주",
  부산광역시: "부산", 부산: "부산", 대구광역시: "대구", 대구: "대구", 인천광역시: "인천", 인천: "인천",
  대전광역시: "대전", 대전: "대전", 울산광역시: "울산", 울산: "울산", 세종특별자치시: "세종", 세종: "세종",
  경기도: "경기", 경기: "경기", 강원특별자치도: "강원", 강원도: "강원", 강원: "강원",
  충청북도: "충북", 충북: "충북", 충청남도: "충남", 충남: "충남",
  전북특별자치도: "전북", 전라북도: "전북", 전북: "전북",
  경상북도: "경북", 경북: "경북", 경상남도: "경남", 경남: "경남",
  제주특별자치도: "제주", 제주도: "제주", 제주: "제주",
};

type Item = Record<string, string | undefined>;
type Link = { label?: string; url: string };
type Lodging = { name: string; distance: number; address?: string; phone?: string; reservationUrl?: string; grade?: string };
type NearPlace = { name: string; distance: number; address?: string; badges?: string[] };
type Parking = { name: string; distance: number; kind?: string; spaces?: number; feeType?: string; basicFee?: string; weekdayHours?: string };
type FestivalImage = { url: string; license: "Type1" | "Type3" };
type Festival = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  sido: string;
  sigungu: string;
  place: string;
  address?: string;
  lat: number;
  lng: number;
  phone?: string;
  host?: string;
  organizer?: string;
  links: Link[];
  overview?: string;
  program?: string;
  subEvent?: string;
  playTime?: string;
  fee?: string;
  discount?: string;
  ageLimit?: string;
  spendTime?: string;
  bookingPlace?: string;
  bookingNotes: string[];
  image?: FestivalImage;
  lodgings?: Lodging[];
  foods?: NearPlace[];
  sights?: NearPlace[];
  parkings?: Parking[];
  modifiedTime: string;
};
const FESTIVAL_ONLY_KEYS = ["lodgings", "foods", "sights", "parkings", "bookingNotes", "discount", "spendTime", "subEvent"] as const;
type OngoingEvent = Omit<Festival, (typeof FESTIVAL_ONLY_KEYS)[number]>;
type Output = {
  source: string;
  fetchedOn: string;
  parkingSource: { url: string; referenceDate: string };
  festivals: Festival[];
  ongoingEvents: OngoingEvent[];
};

function fail(message: string): never {
  console.error(`지역축제 목록을 만들지 못했어요. ${message} 기존 파일은 그대로 두었어요.`);
  process.exit(1);
}

const apiKey = process.env.TOUR_API_KEY?.trim();
if (!apiKey) fail("환경 변수 TOUR_API_KEY가 없어요. 로컬은 .env.local, GitHub는 Secrets에 넣어 주세요.");
const refresh = process.argv.includes("--refresh");
let calls = 0;

async function call(operation: string, params: Record<string, string>): Promise<Item[]> {
  const query = new URLSearchParams({ serviceKey: apiKey!, MobileOS: "ETC", MobileApp: "neo-eodiga", _type: "json", ...params });
  for (let attempt = 1; ; attempt++) {
    calls++;
    try {
      const res = await fetch(`${API_BASE}${operation}?${query}`);
      const body = await res.text();
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      let json: { response?: { header?: { resultCode?: string; resultMsg?: string }; body?: { items?: { item?: Item[] } | "" } } };
      try {
        json = JSON.parse(body);
      } catch {
        // 인증키 오류나 호출 한도 초과는 JSON이 아닌 안내문으로 온다. 안내문에는 키가 없지만 길이만 짧게 줄여 보여준다.
        throw new Error(`JSON이 아닌 응답: ${body.replace(/\s+/g, " ").slice(0, 120)}`);
      }
      const header = json.response?.header;
      if (header?.resultCode !== "0000") throw new Error(`결과 코드 ${header?.resultCode} ${header?.resultMsg ?? ""}`);
      const items = json.response?.body?.items;
      return items && typeof items === "object" ? (items.item ?? []) : [];
    } catch (error) {
      if (attempt >= 3) fail(`${operation} 호출에 실패했어요. (${(error as Error).message})`);
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
}

// 한 번에 몇 개씩만 부른다(호출 제한과 서버 부담을 줄인다).
async function mapLimit<T, R>(list: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(list.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, list.length) }, async () => {
      while (next < list.length) {
        const i = next++;
        results[i] = await fn(list[i]);
      }
    }),
  );
  return results;
}

const ENTITIES: Record<string, string> = { "&nbsp;": " ", "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&apos;": "'" };
// HTML이 섞인 글을 글자로 바꾼다. 줄바꿈은 남긴다.
function plain(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const text = value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&(nbsp|amp|lt|gt|quot|#39|apos);/g, (m) => ENTITIES[m] ?? m)
    .split("\n")
    .map((line) => line.replace(/[ \t ]+/g, " ").trim())
    .filter(Boolean)
    .join("\n")
    .trim();
  return text || undefined;
}

function toUrl(value: string): string | undefined {
  const candidate = /^www\./i.test(value) ? `http://${value}` : value;
  try {
    const url = new URL(candidate);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

// 홈페이지 칸에서 링크만 뽑는다. <a href="...">이름</a>이면 이름을 함께 남긴다.
function extractLinks(...values: (string | undefined)[]): Link[] {
  const links: Link[] = [];
  const seen = new Set<string>();
  const add = (raw: string, label?: string) => {
    const url = toUrl(raw.trim().replace(/&amp;/g, "&"));
    if (!url || seen.has(url)) return;
    seen.add(url);
    const name = plain(label);
    links.push(name && !/^(https?:\/\/|www\.)/i.test(name) ? { label: name, url } : { url });
  };
  for (const value of values) {
    if (!value) continue;
    for (const m of value.matchAll(/<a\s[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) add(m[1], m[2]);
    const rest = value.replace(/<a\s[\s\S]*?<\/a>/gi, " ");
    for (const m of rest.matchAll(/(https?:\/\/[^\s<>"']+|www\.[^\s<>"']+)/gi)) add(m[1].replace(/[),.]+$/, ""));
  }
  return links;
}

// 예약·예매·사전 신청이 들어간 문장을 그대로 모은다(지어내거나 줄이지 않는다).
function findBookingNotes(...values: (string | undefined)[]): string[] {
  const notes: string[] = [];
  for (const value of values) {
    for (const line of value?.split("\n") ?? []) {
      for (const sentence of line.split(/(?<=[.!?])\s+/)) {
        const s = sentence.trim();
        // "선착순 증정"처럼 경품 안내는 예약과 관계없어 뺀다.
        if (s && BOOKING_WORDS.some((w) => s.includes(w)) && !s.includes("증정") && !notes.includes(s)) notes.push(s);
      }
    }
  }
  return notes.slice(0, 4);
}

const toDate = (v = "") => (/^\d{8}$/.test(v) ? `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6, 8)}` : "");
const isDate = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v) && new Date(`${v}T00:00:00Z`).toISOString().startsWith(v);
const value = (v: string | undefined) => plain(v);
// 요금, 시간, 프로그램처럼 "- 성인 12,000원- 청소년 6,000원"으로 붙어 오는 항목을 줄마다 나눈다.
const lines = (v: string | undefined) =>
  plain(v)
    ?.replace(/(?<=\S)- (?=\S)/g, "\n- ")
    .replace(/(?<=\S)\s*※/g, "\n※")
    .replace(/(?<=\S)\[/g, "\n[")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .join("\n");

const regions = JSON.parse(readFileSync(path.join(process.cwd(), "content", "regions.json"), "utf8")) as {
  code: string;
  sido: string;
  sigungu: string;
}[];
const byCode = new Map(regions.map((r) => [r.code, r]));
const pairs = new Set(regions.map((r) => `${r.sido}/${r.sigungu}`));

// 법정동 시도+시군구 코드로 찾는다. 일반구(예: 41113 수원 권선구)는 끝자리를 0으로 바꿔 상위 시로 맞춘다.
// 세종처럼 시군구 칸에 5자리가 들어 있으면 그 값을 쓴다. 그래도 없으면 주소로 찾는다.
function findRegion(item: Item): { sido: string; sigungu: string } | undefined {
  const signgu = item.lDongSignguCd ?? "";
  const code = signgu.length === 5 ? signgu : `${item.lDongRegnCd ?? ""}${signgu}`;
  const found = byCode.get(code) ?? byCode.get(`${code.slice(0, 4)}0`);
  if (found) return { sido: found.sido, sigungu: found.sigungu };
  const words = (item.addr1 ?? "").split(/\s+/);
  const sido = SIDO_SHORT[words[0]];
  if (sido === "세종") return { sido, sigungu: "세종시" };
  if (sido && words[1] && pairs.has(`${sido}/${words[1]}`)) return { sido, sigungu: words[1] };
  return undefined;
}

function toCoordinate(v: string | undefined, min: number, max: number): number | undefined {
  const n = Number(v);
  return v && Number.isFinite(n) && n >= min && n <= max ? Number(n.toFixed(6)) : undefined;
}

function readPrevious(): Map<string, Festival | OngoingEvent> {
  if (refresh || !existsSync(OUTPUT)) return new Map();
  try {
    const old = JSON.parse(readFileSync(OUTPUT, "utf8")) as Partial<Output>;
    return new Map([...(old.festivals ?? []), ...(old.ongoingEvents ?? [])].filter((f) => f.modifiedTime).map((f) => [f.id, f]));
  } catch {
    return new Map();
  }
}

async function fetchLodgings(lat: number, lng: number): Promise<Lodging[]> {
  const items = await call("locationBasedList2", {
    mapX: String(lng),
    mapY: String(lat),
    radius: String(LODGING_RADIUS_M),
    contentTypeId: "32",
    arrange: "E",
    numOfRows: String(LODGING_COUNT),
    pageNo: "1",
  });
  return mapLimit(items.slice(0, LODGING_COUNT), 2, async (item) => {
    const [intro] = await call("detailIntro2", { contentId: item.contentid ?? "", contentTypeId: "32" });
    const reservationUrl = extractLinks(intro?.reservationurl)[0]?.url;
    return {
      name: value(item.title) ?? "이름 없음",
      distance: Math.round(Number(item.dist) || 0),
      ...(value([item.addr1, item.addr2].filter(Boolean).join(" ")) ? { address: value([item.addr1, item.addr2].join(" ")) } : {}),
      ...(value(intro?.infocenterlodging) ?? value(item.tel) ? { phone: value(intro?.infocenterlodging) ?? value(item.tel) } : {}),
      ...(reservationUrl ? { reservationUrl } : {}),
    };
  });
}

// 회사 이름으로 등록된 항목(주식회사, (주))은 먹을 곳이나 볼거리로 보기 어려워 뺀다.
const isCompanyName = (name: string) => /주식회사|(주)|㈜/.test(name);

// 관광공사 자료에서 축제 좌표 근처의 장소를 거리순으로 찾는다. 여러 분류를 합쳐 가까운 count곳만 남긴다.
async function fetchNearby(lat: number, lng: number, contentTypeIds: string[], count: number): Promise<NearPlace[]> {
  const found: NearPlace[] = [];
  for (const contentTypeId of contentTypeIds) {
    const items = await call("locationBasedList2", {
      mapX: String(lng),
      mapY: String(lat),
      radius: String(NEARBY_RADIUS_M),
      contentTypeId,
      arrange: "E",
      numOfRows: String(count),
      pageNo: "1",
    });
    for (const item of items) {
      const name = value(item.title);
      if (!name || isCompanyName(name) || found.some((p) => p.name === name)) continue;
      const address = value([item.addr1, item.addr2].filter(Boolean).join(" "));
      found.push({ name, distance: Math.round(Number(item.dist) || 0), ...(address ? { address } : {}) });
    }
  }
  return found.sort((a, b) => a.distance - b.distance).slice(0, count);
}

type ParkingLot = { info: Omit<Parking, "distance">; lat: number; lng: number };

// 공공데이터포털 전국주차장정보표준데이터를 받는다. 실패하면 undefined를 돌려주고, 그때는 지난 파일의 주차장 정보를 쓴다.
async function fetchParkingLots(): Promise<{ lots: ParkingLot[]; referenceDate: string } | undefined> {
  const headers = { "User-Agent": "Mozilla/5.0 (neo-eodiga festival updater)", "X-Requested-With": "XMLHttpRequest", Referer: PARKING_SOURCE_URL };
  try {
    const headRes = await fetch(`https://www.data.go.kr/download/columList.json?pk=${PARKING_DATASET_PK}&ext=JSON`, { headers });
    if (!headRes.ok) throw new Error(`HTTP ${headRes.status}`);
    const head = (await headRes.json()) as { totalCount: number; tableVO: { colNmList: string[]; svcTableNm: string } };
    const rows: Item[] = [];
    for (let page = 1; page <= Math.ceil(head.totalCount / 10000); page++) {
      const query = new URLSearchParams([
        ["publicDataPk", PARKING_DATASET_PK],
        ...head.tableVO.colNmList.map((c) => ["colNmList", c]),
        ["totalCount", String(head.totalCount)],
        ["svcTableNm", head.tableVO.svcTableNm],
        ["perPage", "10000"],
        ["page", String(page)],
      ]);
      const res = await fetch(`https://www.data.go.kr/download/standard.json?${query}`, { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      rows.push(...((await res.json()) as Item[]));
    }
    if (rows.length < head.totalCount * 0.9) throw new Error(`받은 건수(${rows.length})가 전체(${head.totalCount})보다 너무 적어요.`);
    const hhmm = (v?: string) => (/^\d{2}:\d{2}$/.test(v ?? "") ? v! : undefined);
    const lots: ParkingLot[] = [];
    let referenceDate = "";
    for (const row of rows) {
      const lat = toCoordinate(row.LATITUDE, 33, 39);
      const lng = toCoordinate(row.LONGITUDE, 124, 132);
      const name = value(row.PRKPLCE_NM);
      if (lat === undefined || lng === undefined || !name) continue;
      const ref = toDate((row.REFERENCE_DATE ?? "").replace(/-/g, ""));
      if (ref > referenceDate) referenceDate = ref;
      const spaces = Number(row.PRKCMPRT);
      const basicTime = Number(row.BASIC_TIME);
      const basicCharge = Number(row.BASIC_CHARGE);
      const feeType = value(row.PARKINGCHRGE_INFO);
      const open = hhmm(row.WEEKDAY_OPER_OPEN_HHMM);
      const close = hhmm(row.WEEKDAY_OPER_COLSE_HHMM);
      const allDay = open && close && open <= "00:01" && close >= "23:59";
      lots.push({
        lat,
        lng,
        info: {
        name,
        ...(value(row.PRKPLCE_SE) ? { kind: value(row.PRKPLCE_SE) } : {}),
        ...(Number.isInteger(spaces) && spaces > 0 ? { spaces } : {}),
        ...(feeType ? { feeType } : {}),
        ...(feeType !== "무료" && basicTime > 0 && basicCharge >= 0 && row.BASIC_CHARGE
          ? { basicFee: `기본 ${basicTime}분 ${basicCharge.toLocaleString("ko-KR")}원` }
          : {}),
        ...(allDay ? { weekdayHours: "24시간" } : open && close ? { weekdayHours: `${open}~${close}` } : {}),
        },
      });
    }
    return { lots, referenceDate };
  } catch (error) {
    console.warn(`주차장 자료를 받지 못해 지난 파일의 주차장 정보를 그대로 써요. (${(error as Error).message})`);
    return undefined;
  }
}

function nearestParkings(lots: ParkingLot[], lat: number, lng: number): Parking[] {
  const near = lots
    .map((lot) => ({ lot, distance: distanceMeters({ lat, lng }, lot) }))
    .filter((n) => n.distance <= PARKING_RADIUS_M)
    .sort((a, b) => a.distance - b.distance);
  const picked: Parking[] = [];
  for (const { lot, distance } of near) {
    if (picked.some((p) => p.name === lot.info.name)) continue; // 같은 이름이 여러 줄로 들어 있는 경우
    picked.push({ ...lot.info, distance });
    if (picked.length === PARKING_COUNT) break;
  }
  return picked;
}

const today = todayInKorea();
const from = addDays(today, -KEEP_DAYS_AFTER_END); // 이날 이후에 끝나는 축제만 받는다
const list: Item[] = [];
for (let page = 1; ; page++) {
  const items = await call("searchFestival2", { eventStartDate: from.replace(/-/g, ""), arrange: "A", numOfRows: "500", pageNo: String(page) });
  list.push(...items);
  if (items.length < 500) break;
}
if (list.length === 0) fail("받은 축제가 0건이에요. 자료나 인증키 상태를 확인해 주세요.");

const previous = readPrevious();
const skipped: Record<string, number> = {};
const skip = (reason: string) => (skipped[reason] = (skipped[reason] ?? 0) + 1);
let reused = 0;

type Prepared = { item: Item; id: string; startDate: string; endDate: string; ongoing: boolean; region: { sido: string; sigungu: string }; lat: number; lng: number };
const prepared: Prepared[] = [];
const ids = new Set<string>();
for (const item of list) {
  const id = item.contentid ?? "";
  const name = value(item.title);
  const startDate = toDate(item.eventstartdate);
  const endDate = toDate(item.eventenddate);
  if (!/^\d+$/.test(id) || !name) { skip("id나 이름 없음"); continue; }
  if (ids.has(id)) { skip("같은 축제 중복"); continue; }
  if (!isDate(startDate) || !isDate(endDate) || endDate < startDate) { skip("기간 미정(날짜 없음·형식 오류·순서 오류)"); continue; }
  if (name.includes("미정")) { skip("기간 미정(미정 표기)"); continue; }
  if (endDate < from) { skip(`끝난 지 ${KEEP_DAYS_AFTER_END}일 넘음`); continue; }
  const region = findRegion(item);
  if (!region) { skip("지역을 찾지 못함"); continue; }
  const lat = toCoordinate(item.mapy, 33, 39);
  const lng = toCoordinate(item.mapx, 124, 132);
  if (lat === undefined || lng === undefined) { skip("좌표 없음"); continue; }
  ids.add(id);
  // 1월 1일~12월 31일로 적힌 상설 행사는 목록에서 빼고 축제 포스트의 "주변 상설 행사"로 쓴다.
  const ongoing = startDate.slice(5) === "01-01" && endDate.slice(5) === "12-31";
  prepared.push({ item, id, startDate, endDate, ongoing, region, lat, lng });
}

const built = await mapLimit(prepared, 4, async ({ item, id, startDate, endDate, ongoing, region, lat, lng }) => {
  const modifiedTime = item.modifiedtime ?? "";
  const old = previous.get(id);
  // 수정 시각이 같으면 지난번에 받은 상세 내용을 다시 쓴다(날짜와 지역은 목록 값으로 새로 넣는다).
  if (old && old.modifiedTime === modifiedTime && (ongoing || ("lodgings" in old && "foods" in old && "sights" in old))) {
    reused++;
    const record = { ...old, startDate, endDate, ...region, lat, lng } as Festival;
    if (record.foods) record.foods = record.foods.filter((p) => !isCompanyName(p.name));
    if (record.sights) record.sights = record.sights.filter((p) => !isCompanyName(p.name));
    return { ongoing, record };
  }
  const [common] = await call("detailCommon2", { contentId: id });
  const [intro] = await call("detailIntro2", { contentId: id, contentTypeId: "15" });
  const infos = await call("detailInfo2", { contentId: id, contentTypeId: "15" });
  const info = (name: string) => lines(infos.find((i) => value(i.infoname) === name)?.infotext);
  const imageUrl = toUrl((common?.firstimage ?? item.firstimage ?? "").replace(/^http:\/\//, "https://"));
  const license = common?.cpyrhtDivCd ?? item.cpyrhtDivCd ?? "";
  const overview = value(common?.overview) ?? info("행사소개");
  const program = lines(intro?.program) ?? info("행사내용");
  const subEvent = lines(intro?.subevent);
  const fee = lines(intro?.usetimefestival);
  const discount = lines(intro?.discountinfofestival);
  const bookingPlace = lines(intro?.bookingplace);
  const record: Festival = {
    id,
    name: value(item.title)!,
    startDate,
    endDate,
    ...region,
    place: value(intro?.eventplace) ?? "",
    ...(value([item.addr1, item.addr2].filter(Boolean).join(" ")) ? { address: value([item.addr1, item.addr2].join(" ")) } : {}),
    lat,
    lng,
    ...(value(common?.tel ?? item.tel) ? { phone: value(common?.tel ?? item.tel) } : {}),
    ...(value(intro?.sponsor1) ? { host: value(intro?.sponsor1) } : {}),
    ...(value(intro?.sponsor2) ? { organizer: value(intro?.sponsor2) } : {}),
    links: extractLinks(common?.homepage, intro?.eventhomepage),
    ...(overview ? { overview } : {}),
    ...(program ? { program } : {}),
    ...(subEvent ? { subEvent } : {}),
    ...(lines(intro?.playtime) ? { playTime: lines(intro?.playtime) } : {}),
    ...(fee ? { fee } : {}),
    ...(discount ? { discount } : {}),
    ...(lines(intro?.agelimit) ? { ageLimit: lines(intro?.agelimit) } : {}),
    ...(lines(intro?.spendtimefestival) ? { spendTime: lines(intro?.spendtimefestival) } : {}),
    ...(bookingPlace ? { bookingPlace } : {}),
    bookingNotes: findBookingNotes(bookingPlace, fee, discount, overview, program, subEvent, info("행사내용")),
    ...(imageUrl && ALLOWED_IMAGE_TYPES.has(license) ? { image: { url: imageUrl, license: license as FestivalImage["license"] } } : {}),
    modifiedTime,
  };
  if (!ongoing) {
    record.lodgings = await fetchLodgings(lat, lng);
    record.foods = await fetchNearby(lat, lng, ["39"], NEARBY_COUNT); // 음식점
    record.sights = await fetchNearby(lat, lng, ["12", "14"], NEARBY_COUNT); // 관광지, 문화시설
  }
  return { ongoing, record };
});

// 주차장은 축제 내용과 관계없이 바뀔 수 있어 매번 새로 고른다. 받기에 실패하면 지난 파일의 값을 쓴다.
// 공식 인증·지정 표시(content/badge-index.json, npm run build-badges). 색인이 없으면 표시 없이 만든다.
const BADGE_INDEX = path.join(process.cwd(), "content", "badge-index.json");
const badgeIndex = existsSync(BADGE_INDEX)
  ? (JSON.parse(readFileSync(BADGE_INDEX, "utf8")) as { restaurants: Record<string, string[]>; hotels: Record<string, string> })
  : undefined;
if (!badgeIndex) console.warn("content/badge-index.json이 없어 먹을 곳·숙소 표시를 붙이지 않아요. npm run build-badges를 먼저 실행해 주세요.");
for (const { ongoing, record } of built) {
  if (ongoing || !badgeIndex) continue;
  record.foods = record.foods?.map(({ badges: _old, ...p }) => {
    void _old;
    const badges = badgeIndex.restaurants[badgeKey(p.name, p.address) ?? ""];
    return badges ? { ...p, badges } : p;
  });
  record.lodgings = record.lodgings?.map(({ grade: _old, ...l }) => {
    void _old;
    const grade = badgeIndex.hotels[badgeKey(l.name, l.address) ?? ""];
    return grade ? { ...l, grade } : l;
  });
}

const parkingData = await fetchParkingLots();
const oldOutput = existsSync(OUTPUT) ? (JSON.parse(readFileSync(OUTPUT, "utf8")) as Partial<Output>) : {};
for (const { ongoing, record } of built) {
  if (ongoing) continue;
  record.parkings = parkingData
    ? nearestParkings(parkingData.lots, record.lat, record.lng)
    : ((previous.get(record.id) as Festival | undefined)?.parkings ?? []);
}
const parkingSource = {
  url: PARKING_SOURCE_URL,
  referenceDate: parkingData?.referenceDate || oldOutput.parkingSource?.referenceDate || today,
};

// localeCompare는 실행하는 컴퓨터(Windows, GitHub의 Linux)마다 순서가 달라서, 내용이 같아도 파일이 바뀐 것으로 보인다.
// 그래서 글자 코드 순서로 정렬하고 id로 마지막 순서를 정한다. 화면의 순서는 화면 코드가 따로 정한다.
const plainCompare = (x: string, y: string) => (x < y ? -1 : x > y ? 1 : 0);
const byStart = (a: { startDate: string; name: string; id: string }, b: { startDate: string; name: string; id: string }) =>
  plainCompare(a.startDate, b.startDate) || plainCompare(a.name, b.name) || plainCompare(a.id, b.id);
const festivals = built.filter((b) => !b.ongoing).map((b) => b.record).sort(byStart);
const ongoingEvents: OngoingEvent[] = built
  .filter((b) => b.ongoing)
  .map(({ record }) => {
    // 상설 행사에는 숙소, 주변 정보, 예약 문장, 할인, 소요 시간, 부대행사를 담지 않는다.
    const rest: Partial<Festival> = { ...record };
    for (const key of FESTIVAL_ONLY_KEYS) delete rest[key];
    return rest as OngoingEvent;
  })
  .sort(byStart);
const output: Output = { source: SOURCE_URL, fetchedOn: today, parkingSource, festivals, ongoingEvents };
writeFileSync(OUTPUT, `${JSON.stringify(output, null, 2)}\n`, "utf8");

console.log(
  `content/festivals.json을 만들었어요. 받은 자료 ${list.length}건 중 축제 ${festivals.length}건, 상설 행사 ${ongoingEvents.length}건을 넣었어요. (기준일 ${today}, API 호출 ${calls}번, 지난 내용 재사용 ${reused}건)`,
);
for (const [reason, count] of Object.entries(skipped)) console.log(`- 뺀 자료: ${reason} ${count}건`);
