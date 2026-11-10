// 빌드 전에 모든 콘텐츠가 규칙에 맞는지 검사하는 스크립트(문제가 있으면 빌드를 멈춘다)
import { loadContent } from "../src/lib/content.ts";

try {
  const { regions, places, reviews, notices, guides } = loadContent();
  console.log(
    `콘텐츠 검사를 통과했어요. 지역 ${regions.length}, 장소 ${places.length}, 후기 ${reviews.length}, 공지 ${notices.length}, 이용 안내 ${guides.length}.`,
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
