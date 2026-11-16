// 공공데이터포털 전국주차장정보표준데이터(인증키 없음)를 받아 좌표 근처 주차장을 고르는 함수(build-festivals, build-attractions가 함께 쓴다)
import { distanceMeters } from "../../src/lib/festivals.ts";

const PARKING_DATASET_PK = "15012896";
export const PARKING_SOURCE_URL = `https://www.data.go.kr/data/${PARKING_DATASET_PK}/standard.do`;

export type Parking = { name: string; distance: number; kind?: string; spaces?: number; feeType?: string; basicFee?: string; weekdayHours?: string };
export type ParkingLot = { info: Omit<Parking, "distance">; lat: number; lng: number };

type Row = Record<string, string | undefined>;
const text = (v?: string) => v?.replace(/\s+/g, " ").trim() || undefined;
const coordinate = (v: string | undefined, min: number, max: number) => {
  const n = Number(v);
  return v && Number.isFinite(n) && n >= min && n <= max ? Number(n.toFixed(6)) : undefined;
};

// 받기에 실패하면 undefined를 돌려준다. 그때는 부르는 쪽이 지난 파일의 주차장 정보를 쓴다.
export async function fetchParkingLots(): Promise<{ lots: ParkingLot[]; referenceDate: string } | undefined> {
  const headers = { "User-Agent": "Mozilla/5.0 (neo-eodiga updater)", "X-Requested-With": "XMLHttpRequest", Referer: PARKING_SOURCE_URL };
  try {
    const headRes = await fetch(`https://www.data.go.kr/download/columList.json?pk=${PARKING_DATASET_PK}&ext=JSON`, { headers });
    if (!headRes.ok) throw new Error(`HTTP ${headRes.status}`);
    const head = (await headRes.json()) as { totalCount: number; tableVO: { colNmList: string[]; svcTableNm: string } };
    const rows: Row[] = [];
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
      rows.push(...((await res.json()) as Row[]));
    }
    if (rows.length < head.totalCount * 0.9) throw new Error(`받은 건수(${rows.length})가 전체(${head.totalCount})보다 너무 적어요.`);
    const hhmm = (v?: string) => (/^\d{2}:\d{2}$/.test(v ?? "") ? v! : undefined);
    const lots: ParkingLot[] = [];
    let referenceDate = "";
    for (const row of rows) {
      const lat = coordinate(row.LATITUDE, 33, 39);
      const lng = coordinate(row.LONGITUDE, 124, 132);
      const name = text(row.PRKPLCE_NM);
      if (lat === undefined || lng === undefined || !name) continue;
      const ref = /^\d{4}-\d{2}-\d{2}$/.test(row.REFERENCE_DATE ?? "") ? row.REFERENCE_DATE! : "";
      if (ref > referenceDate) referenceDate = ref;
      const spaces = Number(row.PRKCMPRT);
      const basicTime = Number(row.BASIC_TIME);
      const basicCharge = Number(row.BASIC_CHARGE);
      const feeType = text(row.PARKINGCHRGE_INFO);
      const open = hhmm(row.WEEKDAY_OPER_OPEN_HHMM);
      const close = hhmm(row.WEEKDAY_OPER_COLSE_HHMM);
      const allDay = open && close && open <= "00:01" && close >= "23:59";
      lots.push({
        lat,
        lng,
        info: {
          name,
          ...(text(row.PRKPLCE_SE) ? { kind: text(row.PRKPLCE_SE) } : {}),
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

// 좌표에서 radius 안의 가까운 count곳. 같은 이름이 여러 줄로 들어 있으면 하나만 둔다.
export function nearestParkings(lots: ParkingLot[], lat: number, lng: number, radius = 1000, count = 3): Parking[] {
  const near = lots
    .map((lot) => ({ lot, distance: distanceMeters({ lat, lng }, lot) }))
    .filter((n) => n.distance <= radius)
    .sort((a, b) => a.distance - b.distance);
  const picked: Parking[] = [];
  for (const { lot, distance } of near) {
    if (picked.some((p) => p.name === lot.info.name)) continue;
    picked.push({ ...lot.info, distance });
    if (picked.length === count) break;
  }
  return picked;
}
