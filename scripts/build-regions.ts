// 공식 법정동코드 CSV에서 전국 시도·시군구 목록(content/regions.json)을 만드는 스크립트
// 사용법: npm run build-regions -- <법정동코드 CSV 경로>
// 자료 출처와 변환 규칙은 context-notes.md의 "지역 데이터 출처"에 적는다.
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

// 법정동코드 자료의 시도 이름 → 화면에 쓰는 짧은 이름
const SIDO_SHORT: Record<string, string> = {
  서울특별시: "서울",
  전남광주통합특별시: "전남광주",
  부산광역시: "부산",
  대구광역시: "대구",
  인천광역시: "인천",
  대전광역시: "대전",
  울산광역시: "울산",
  세종특별자치시: "세종",
  경기도: "경기",
  강원특별자치도: "강원",
  충청북도: "충북",
  충청남도: "충남",
  전북특별자치도: "전북",
  경상북도: "경북",
  경상남도: "경남",
  제주특별자치도: "제주",
};

type Region = { code: string; sido: string; sigungu: string };

function fail(message: string): never {
  console.error(`지역 목록을 만들지 못했어요. ${message}`);
  process.exit(1);
}

const csvPath = process.argv[2];
if (!csvPath) fail("법정동코드 CSV 경로를 인자로 넘겨주세요. 예: npm run build-regions -- ./법정동코드.csv");

const text = new TextDecoder("euc-kr").decode(readFileSync(csvPath));
const [header, ...lines] = text.split(/\r?\n/).filter((line) => line.trim() !== "");
if (header.trim() !== "법정동코드,법정동명,폐지여부") {
  fail(`CSV 첫 줄이 예상과 달라요. (지금 값: ${header})`);
}

// 시군구 단위 행만 고른다. 10자리 코드의 뒤 5자리가 00000이고, 시도 단위(앞 2자리 뒤 000)가 아닌 행이다.
const rows = lines
  .map((line) => line.split(","))
  .filter(([code, , status]) => status?.trim() === "존재" && /^\d{10}$/.test(code))
  .filter(([code]) => code.endsWith("00000") && code.slice(2, 5) !== "000")
  .map(([code, name]) => ({ code: code.slice(0, 5), words: name.trim().split(/\s+/) }));

const regions: Region[] = [];
const cityNames = new Set(rows.filter((r) => r.words.length === 2).map((r) => r.words.join(" ")));

for (const { code, words } of rows) {
  if (words.length === 1) {
    // 세종특별자치시는 시군구가 없는 단층 구조라 시군구 이름을 "세종시"로 둔다.
    if (words[0] !== "세종특별자치시") fail(`이름이 한 단어인 행을 처리할 수 없어요. (${code} ${words[0]})`);
    regions.push({ code, sido: "세종", sigungu: "세종시" });
  } else if (words.length === 2) {
    const sido = SIDO_SHORT[words[0]];
    if (!sido) fail(`짧은 이름이 정해지지 않은 시도가 있어요. (${words[0]}) 스크립트의 SIDO_SHORT에 추가해주세요.`);
    regions.push({ code, sido, sigungu: words[1] });
  } else if (words.length === 3) {
    // 일반구(예: 수원시 장안구)는 나누지 않는다. 상위 시가 목록에 있는지만 확인한다.
    const city = words.slice(0, 2).join(" ");
    if (!cityNames.has(city)) fail(`일반구의 상위 시를 찾지 못했어요. (${code} ${words.join(" ")})`);
  } else {
    fail(`이름 형식을 처리할 수 없어요. (${code} ${words.join(" ")})`);
  }
}

regions.sort((a, b) => a.code.localeCompare(b.code));

const sidoCount = new Set(regions.map((r) => r.sido)).size;
if (sidoCount !== Object.keys(SIDO_SHORT).length) {
  fail(`시도 수가 ${sidoCount}개로, 짧은 이름 표의 ${Object.keys(SIDO_SHORT).length}개와 달라요.`);
}

const outPath = path.join(process.cwd(), "content", "regions.json");
const body = regions.map((r) => `  ${JSON.stringify(r)}`).join(",\n");
writeFileSync(outPath, `[\n${body}\n]\n`, "utf8");
console.log(`content/regions.json을 만들었어요. 시도 ${sidoCount}개, 시군구 ${regions.length}개.`);
