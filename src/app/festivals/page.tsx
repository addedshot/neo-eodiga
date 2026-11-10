// 지역축제 메뉴의 준비 중 페이지(기능은 Plan을 세운 뒤 만든다, 검색엔진에는 노출하지 않는다)
import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata: Metadata = { title: "지역축제", robots: { index: false } };

export default function FestivalsPage() {
  return <ComingSoon title="지역축제" description="지역별 축제 일정과 근처에서 함께 들르기 좋은 곳을 모아 보여줄 예정이에요." />;
}
