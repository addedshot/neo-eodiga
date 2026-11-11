// 메인의 지역축제 상자 내용(오늘 이후에 시작하는 축제 중 가까운 4개). 오늘 날짜로 요청 때 그린다.
import { connection } from "next/server";
import { FestivalList } from "@/components/FestivalList";
import { loadContent } from "@/lib/content";
import { todayInKorea, upcomingFestivals } from "@/lib/festivals";

export async function MainFestivals() {
  await connection();
  const today = todayInKorea();
  const items = upcomingFestivals(loadContent().festivals, today, 4).map((festival) => ({ festival, status: "예정" as const }));
  if (items.length === 0) return <p className="py-3 text-ink-muted">곧 열리는 축제가 없어요.</p>;
  return <FestivalList items={items} today={today} showStatus={false} />;
}
