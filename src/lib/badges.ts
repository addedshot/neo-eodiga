// 식당·숙박의 공식 인증·지정 표시(모범음식점, 백년가게, 호텔 등급)를 찾을 때 쓰는 이름·주소 맞추기 함수
// scripts(build-badges, build-festivals)도 Node로 직접 불러 쓰므로 다른 로컬 파일을 import하지 않는다.

// 주소 앞의 시도 이름(긴 이름, 옛 이름 포함) → 짧은 이름
const SIDO_NAMES: [string, string][] = [
  ["서울특별시", "서울"], ["부산광역시", "부산"], ["대구광역시", "대구"], ["인천광역시", "인천"], ["광주광역시", "전남광주"],
  ["대전광역시", "대전"], ["울산광역시", "울산"], ["세종특별자치시", "세종"], ["경기도", "경기"], ["강원특별자치도", "강원"],
  ["강원도", "강원"], ["충청북도", "충북"], ["충청남도", "충남"], ["전북특별자치도", "전북"], ["전라북도", "전북"],
  ["전남광주통합특별시", "전남광주"], ["전라남도", "전남광주"], ["경상북도", "경북"], ["경상남도", "경남"],
  ["제주특별자치도", "제주"], ["서울", "서울"], ["부산", "부산"], ["대구", "대구"], ["인천", "인천"], ["광주", "전남광주"],
  ["대전", "대전"], ["울산", "울산"], ["세종", "세종"], ["경기", "경기"], ["강원", "강원"], ["충북", "충북"], ["충남", "충남"],
  ["전북", "전북"], ["전남", "전남광주"], ["경북", "경북"], ["경남", "경남"], ["제주", "제주"],
];

// 이름 비교용. 띄어쓰기, 괄호 안의 말, 기호, 끝의 "본점"을 뺀다. 예: "수다 (서래점)" → "수다", "할매국밥 본점" → "할매국밥"
export function normalizeName(name: string): string {
  return name
    .replace(/\[[^\]]*\]|\([^)]*\)/g, "")
    .replace(/[\s·ㆍ.,'"’‘“”&\-_/]/g, "")
    .replace(/본점$/, "")
    .toLowerCase();
}

// 주소에서 "시도|시군구" 열쇠를 만든다. 띄어쓰기가 빠진 주소("강원도평창군 봉평면")도 읽는다. 세종은 시군구가 없다.
export function regionKeyOfAddress(address: string): string | undefined {
  const compact = address.replace(/\s+/g, "");
  const found = SIDO_NAMES.find(([long]) => compact.startsWith(long));
  if (!found) return undefined;
  const [long, short] = found;
  if (short === "세종") return "세종|세종시";
  const rest = compact.slice(long.length);
  const sigungu = rest.match(/^(.+?[시군구])/)?.[1];
  return sigungu ? `${short}|${sigungu}` : undefined;
}

// 표시를 찾는 열쇠: "시도|시군구|이름"
export function badgeKey(name: string, address: string | undefined): string | undefined {
  const region = address ? regionKeyOfAddress(address) : undefined;
  const n = normalizeName(name);
  return region && n.length >= 2 ? `${region}|${n}` : undefined;
}

// 위생등급은 식품안전나라 C004 자료의 지정등급이 모두 "적합"이라 등급 단계 없이 "위생등급 지정"으로만 표시한다(2026-11-13 확인).
export type RestaurantBadge = "모범음식점" | "백년가게" | "위생등급 지정";
