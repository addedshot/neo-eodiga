// 대표 명소를 고르는 근거 자료(100대 명산, 유네스코 세계유산, 국가유산 사적·명승)를 받아 content/reference.json을 만드는 스크립트
// 사용법: npm run build-reference   (모두 인증키 없이 받는다. 자료가 자주 바뀌지 않으므로 가끔 다시 실행한다)
// 한국관광 100선은 보도자료를 옮겨 적은 content/korea-top100.json을 따로 쓴다.
import { writeFileSync } from "node:fs";
import path from "node:path";
import { todayInKorea } from "../src/lib/festivals.ts";

const OUTPUT = path.join(process.cwd(), "content", "reference.json");
const SOURCES = {
  mountains: "https://www.data.go.kr/data/15112801/fileData.do", // 산림청 국립자연휴양림관리소 숲나들e 100대명산
  unesco: "https://www.data.go.kr/data/15107994/fileData.do", // 국가유산청 한국의 유네스코 세계유산 정보
  heritage: "https://www.data.go.kr/data/15034324/openapi.do", // 국가유산청 전국 지정문화재 현황(국가유산청 오픈 API로 연결)
};

function fail(message: string): never {
  console.error(`근거 자료를 만들지 못했어요. ${message} 기존 파일은 그대로 두었어요.`);
  process.exit(1);
}

// 공공데이터포털 파일 데이터는 파일 번호를 먼저 받은 뒤 내려받는다(누리집의 내려받기 버튼과 같은 순서).
async function downloadPortalFile(pageUrl: string, encoding: "utf-8" | "euc-kr"): Promise<string> {
  const pk = pageUrl.match(/data\/(\d+)\//)?.[1];
  const page = await (await fetch(pageUrl)).text();
  const detailPk = page.match(/name="publicDataDetailPk" value="([^"]+)"/)?.[1];
  if (!pk || !detailPk) fail(`${pageUrl}에서 파일 정보를 찾지 못했어요.`);
  const info = await fetch("https://www.data.go.kr/tcs/dss/selectFileDataDownload.do", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "X-Requested-With": "XMLHttpRequest", Referer: pageUrl },
    body: new URLSearchParams({ publicDataDetailPk: detailPk, publicDataPk: pk, atchFileId: "", fileDetailSn: "1", publicDataTyCode: "PR0051" }),
  });
  const json = JSON.parse(await info.text()) as { atchFileId?: string | null; fileDetailSn?: string | number | null };
  if (!json.atchFileId) fail(`${pageUrl}의 첨부 파일 번호를 받지 못했어요.`);
  const res = await fetch(`https://www.data.go.kr/cmm/cmm/fileDownload.do?atchFileId=${json.atchFileId}&fileDetailSn=${json.fileDetailSn ?? 1}`);
  if (!res.ok) fail(`${pageUrl} 파일을 받지 못했어요. (HTTP ${res.status})`);
  return new TextDecoder(encoding).decode(await res.arrayBuffer()).replace(/^﻿/, "");
}

// 따옴표 안의 쉼표와 줄바꿈을 지키는 CSV 읽기
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
  return body.filter((r) => r.length >= header.length).map((r) => Object.fromEntries(header.map((h, i) => [h.trim(), r[i].trim()])));
}

const inKorea = (lat: number, lng: number) => lat > 33 && lat < 39 && lng > 124 && lng < 132;

// 1. 100대 명산
const mountainRows = parseCsv(await downloadPortalFile(SOURCES.mountains, "utf-8"));
const mountains = mountainRows
  .map((r) => ({ name: r["명산_이름"], address: r["명산_소재지"], height: Number(r["명산_높이"]), lat: Number(r["Y좌표"]), lng: Number(r["X좌표"]) }))
  .filter((m) => m.name && inKorea(m.lat, m.lng));
if (mountains.length < 90) fail(`100대 명산이 ${mountains.length}건뿐이에요.`);

// 2. 유네스코 세계유산(좌표가 없다. 명소와 이름이나 내용으로 맞춘다)
const unescoRows = parseCsv(await downloadPortalFile(SOURCES.unesco, "euc-kr"));
// 내용 칸에 묶인 구성 장소(예: 산사의 사찰 이름)가 적혀 있어 명소와 맞출 때 함께 쓴다.
const unesco = unescoRows.map((r) => ({ name: r["세계유산명"], description: r["내용"] })).filter((u) => u.name);
if (unesco.length < 10) fail(`세계유산이 ${unesco.length}건뿐이에요.`);

// 3. 국가유산 사적(13), 명승(15). 국가유산청 오픈 API는 인증키 없이 XML로 응답한다.
const KINDS: Record<string, string> = { "13": "사적", "15": "명승" };
const heritage: { kind: string; name: string; sido: string; sigungu: string; lat: number; lng: number }[] = [];
const cdata = (xml: string, tag: string) => xml.match(new RegExp(`<${tag}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${tag}>`))?.[1]?.trim() ?? "";
for (const code of Object.keys(KINDS)) {
  for (let page = 1; ; page++) {
    const res = await fetch(`https://www.khs.go.kr/cha/SearchKindOpenapiList.do?ccbaKdcd=${code}&pageUnit=500&pageIndex=${page}`);
    if (!res.ok) fail(`국가유산청 API 호출에 실패했어요. (HTTP ${res.status})`);
    const xml = await res.text();
    const items = xml.split("<item>").slice(1);
    for (const item of items) {
      if (cdata(item, "ccbaCncl") === "Y") continue; // 지정 해제
      const lat = Number(cdata(item, "latitude"));
      const lng = Number(cdata(item, "longitude"));
      heritage.push({
        kind: KINDS[code],
        name: cdata(item, "ccbaMnm1"),
        sido: cdata(item, "ccbaCtcdNm"),
        sigungu: cdata(item, "ccsiName"),
        ...(inKorea(lat, lng) ? { lat, lng } : { lat: 0, lng: 0 }),
      });
    }
    const total = Number(cdata(xml, "totalCnt"));
    if (items.length === 0 || page * 500 >= total) break;
  }
}
if (heritage.length < 500) fail(`국가유산이 ${heritage.length}건뿐이에요.`);

const byName = <T extends { name: string }>(list: T[]) => [...list].sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
const output = {
  fetchedOn: todayInKorea(),
  sources: SOURCES,
  mountains: byName(mountains),
  unesco: byName(unesco),
  heritage: byName(heritage),
};
writeFileSync(OUTPUT, `${JSON.stringify(output, null, 2)}\n`, "utf8");
const noCoord = heritage.filter((h) => h.lat === 0).length;
console.log(
  `content/reference.json을 만들었어요. 100대 명산 ${mountains.length}, 세계유산 ${unesco.length}, 국가유산 ${heritage.length}(사적 ${heritage.filter((h) => h.kind === "사적").length}, 명승 ${heritage.filter((h) => h.kind === "명승").length}, 좌표 없음 ${noCoord})`,
);
