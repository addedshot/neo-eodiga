// 빌드 전에 모든 콘텐츠가 규칙에 맞는지 검사하는 스크립트(문제가 있으면 빌드를 멈춘다)
import { loadAttractionData } from "../src/lib/attractions.ts";
import { loadContent } from "../src/lib/content.ts";

try {
  const { regions, places, reviews, notices, guides, festivals } = loadContent();
  const { attractions, centers } = loadAttractionData();
  const regionKeys = new Set(regions.map((r) => `${r.sido}/${r.sigungu}`));
  const wrong = attractions.filter((a) => !regionKeys.has(`${a.sido}/${a.sigungu}`)).map((a) => `${a.name}(${a.sido} ${a.sigungu})`);
  if (wrong.length) throw new Error(`content/attractions.json: regions.json에 없는 시도·시군구가 있어요. ${wrong.slice(0, 5).join(", ")}`);
  const noCenter = regions.filter((r) => !centers[r.code]).map((r) => `${r.sido} ${r.sigungu}`);
  if (noCenter.length) throw new Error(`content/region-centers.json: 대표 좌표가 없는 시군구가 있어요. ${noCenter.join(", ")}`);
  console.log(
    `콘텐츠 검사를 통과했어요. 지역 ${regions.length}, 장소 ${places.length}, 후기 ${reviews.length}, 공지 ${notices.length}, 이용 안내 ${guides.length}, 지역축제 ${festivals.length}, 명소 ${attractions.length}.`,
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
