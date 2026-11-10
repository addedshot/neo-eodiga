// 여행추천 메뉴의 준비 중 페이지(기능은 Plan을 세운 뒤 만든다, 검색엔진에는 노출하지 않는다)
import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata: Metadata = { title: "여행추천", robots: { index: false } };

export default function RecommendPage() {
  return <ComingSoon title="여행추천" description="누구와, 언제 가는지 고르면 직접 다녀온 기록을 바탕으로 추천 코스를 보여줄 예정이에요. 예약이 필요한 곳은 예약 링크로 안내해요." />;
}
