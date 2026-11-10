// 여행지도 메뉴의 준비 중 페이지(기능은 Plan을 세운 뒤 만든다, 검색엔진에는 노출하지 않는다)
import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata: Metadata = { title: "여행지도", robots: { index: false } };

export default function MapPage() {
  return <ComingSoon title="여행지도" description="다녀온 시군구를 지도에 표시해 한눈에 볼 수 있게 할 예정이에요." />;
}
