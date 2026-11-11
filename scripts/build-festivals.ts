// 공공데이터포털 "전국문화축제표준데이터"를 받아 지역축제 목록(content/festivals.json)을 만드는 스크립트
// 사용법: npm run build-festivals   (자동 갱신은 .github/workflows/update-festivals.yml이 주 1회 실행한다)
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { addDays, KEEP_DAYS_AFTER_END, todayInKorea } from "../src/lib/festivals.ts";

const DATASET_PK = "15013104";
const SOURCE_URL = `https://www.data.go.kr/data/${DATASET_PK}/standard.do`;
const HEADERS = {
  "User-Agent": "Mozilla/5.0 (neo-eodiga festival updater)",
  "X-Requested-With": "XMLHttpRequest",
  Referer: SOURCE_URL,
};

// 자료의 시도 이름(옛 이름 포함) → regions.json의 짧은 이름
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

type Row = Record<string, string | null | undefined>;
type Festival = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  sido: string;
  sigungu: string;
  place: string;
  content?: string;
  organizer?: string;
  host?: string;
  phone?: string;
  homepage?: string;
  address?: string;
  lat?: number;
  lng?: number;
  referenceDate?: string;
  provider?: string;
};

function fail(message: string): never {
  console.error(`지역축제 목록을 만들지 못했어요. ${message}`);
  process.exit(1);
}

const isDate = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v) && new Date(`${v}T00:00:00Z`).toISOString().startsWith(v);
const text = (row: Row, key: string) => (row[key] ?? "").replace(/"/g, "").replace(/\s+/g, " ").trim();

async function fetchRows(): Promise<Row[]> {
  const headRes = await fetch(`https://www.data.go.kr/download/columList.json?pk=${DATASET_PK}&ext=JSON`, { headers: HEADERS });
  if (!headRes.ok) fail(`항목 정보를 받지 못했어요. (HTTP ${headRes.status})`);
  const head = (await headRes.json()) as { totalCount: number; tableVO: { colNmList: string[]; svcTableNm: string } };
  const perPage = 10000;
  const rows: Row[] = [];
  for (let page = 1; page <= Math.ceil(head.totalCount / perPage); page++) {
    const query = new URLSearchParams([
      ["publicDataPk", DATASET_PK],
      ...head.tableVO.colNmList.map((c) => ["colNmList", c]),
      ["totalCount", String(head.totalCount)],
      ["svcTableNm", head.tableVO.svcTableNm],
      ["perPage", String(perPage)],
      ["page", String(page)],
    ]);
    const res = await fetch(`https://www.data.go.kr/download/standard.json?${query}`, { headers: HEADERS });
    if (!res.ok) fail(`자료를 받지 못했어요. (HTTP ${res.status}, ${page}쪽)`);
    rows.push(...((await res.json()) as Row[]));
  }
  if (rows.length !== head.totalCount) fail(`받은 건수(${rows.length})가 전체 건수(${head.totalCount})와 달라요.`);
  return rows;
}

const regions = JSON.parse(readFileSync(path.join(process.cwd(), "content", "regions.json"), "utf8")) as {
  sido: string;
  sigungu: string;
}[];
const pairs = new Set(regions.map((r) => `${r.sido}/${r.sigungu}`));

// 도로명주소, 지번주소, 제공기관명 순서로 시도·시군구를 찾는다.
function findRegion(row: Row): { sido: string; sigungu: string } | undefined {
  for (const key of ["RDNMADR", "LNMADR", "INSTT_NM"]) {
    const words = text(row, key).split(" ");
    const sido = SIDO_SHORT[words[0]];
    if (!sido) continue;
    if (sido === "세종") return { sido, sigungu: "세종시" };
    if (words[1] && pairs.has(`${sido}/${words[1]}`)) return { sido, sigungu: words[1] };
  }
  return undefined;
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

function toCoordinate(value: string, min: number, max: number): number | undefined {
  const n = Number(value);
  return value && Number.isFinite(n) && n >= min && n <= max ? n : undefined;
}

const today = todayInKorea();
const cutoff = addDays(today, -KEEP_DAYS_AFTER_END); // 끝나는 날이 이보다 앞서면 뺀다
const rows = await fetchRows();
const skipped: Record<string, number> = {};
const skip = (reason: string) => (skipped[reason] = (skipped[reason] ?? 0) + 1);
const byId = new Map<string, Festival>();

for (const row of rows) {
  const name = text(row, "FSTVL_NM");
  const startDate = text(row, "FSTVL_START_DATE");
  const endDate = text(row, "FSTVL_END_DATE");
  const place = text(row, "OPAR");
  if (!name) { skip("이름 없음"); continue; }
  if (!isDate(startDate) || !isDate(endDate) || endDate < startDate) { skip("기간 미정(날짜 없음·형식 오류·순서 오류)"); continue; }
  if (startDate.slice(5) === "01-01" && endDate.slice(5) === "12-31") { skip("기간 미정(한 해 전체)"); continue; }
  if (name.includes("미정") || place.includes("미정")) { skip("기간 미정(미정 표기)"); continue; }
  if (endDate < cutoff) { skip(`끝난 지 ${KEEP_DAYS_AFTER_END}일 넘음`); continue; }
  const region = findRegion(row);
  if (!region) { skip("지역을 찾지 못함"); continue; }

  const provider = text(row, "INSTT_NM");
  const id = createHash("sha1").update(`${name}|${startDate}|${text(row, "INSTT_CODE")}`).digest("hex").slice(0, 10);
  if (byId.has(id)) { skip("같은 축제 중복"); continue; }
  const lat = toCoordinate(text(row, "LATITUDE"), 33, 39);
  const lng = toCoordinate(text(row, "LONGITUDE"), 124, 132);
  const festival: Festival = {
    id,
    name,
    startDate,
    endDate,
    ...region,
    place,
    content: text(row, "FSTVL_CO") || undefined,
    organizer: text(row, "MNNST_NM") || undefined,
    host: text(row, "AUSPC_INSTT_NM") || undefined,
    phone: text(row, "PHONE_NUMBER") || undefined,
    homepage: toUrl(text(row, "HOMEPAGE_URL")),
    address: text(row, "RDNMADR") || text(row, "LNMADR") || undefined,
    ...(lat !== undefined && lng !== undefined ? { lat, lng } : {}),
    referenceDate: isDate(text(row, "REFERENCE_DATE")) ? text(row, "REFERENCE_DATE") : undefined,
    provider: provider || undefined,
  };
  byId.set(id, festival);
}

const festivals = [...byId.values()].sort((a, b) => a.startDate.localeCompare(b.startDate) || a.name.localeCompare(b.name));
const output = { source: SOURCE_URL, fetchedOn: today, festivals };
writeFileSync(path.join(process.cwd(), "content", "festivals.json"), `${JSON.stringify(output, null, 2)}\n`, "utf8");

console.log(`content/festivals.json을 만들었어요. 받은 자료 ${rows.length}건 중 ${festivals.length}건을 넣었어요. (기준일 ${today})`);
for (const [reason, count] of Object.entries(skipped)) console.log(`- 뺀 자료: ${reason} ${count}건`);
