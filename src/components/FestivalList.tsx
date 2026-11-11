// 지역축제 목록 줄(상태 배지, 축제 이름, 지역과 기간). 지역축제 페이지와 메인에서 쓴다.
import Link from "next/link";
import { formatPeriod, type FestivalStatus, type ShownFestival } from "@/lib/festivals";

const BADGE_CLASS: Record<FestivalStatus, string> = {
  예정: "bg-point-bg text-point-ink",
  "진행 중": "bg-visited-bg text-visited-ink",
  종료: "bg-surface-muted text-ink-muted",
};

export function FestivalStatusBadge({ status }: { status: FestivalStatus }) {
  return (
    <span className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${BADGE_CLASS[status]}`}>
      {status}
    </span>
  );
}

// showStatus가 false면 배지를 빼고 한 줄로 보여준다(메인처럼 모두 "예정"인 목록).
export function FestivalList({ items, today, showStatus = true }: { items: ShownFestival[]; today: string; showStatus?: boolean }) {
  return (
    <ul>
      {items.map(({ festival, status }) => (
        <li key={festival.id} className="border-b border-line last:border-b-0">
          <Link href={`/festivals/${festival.id}`} className="flex min-h-14 items-center gap-3 py-3 text-ink">
            {showStatus && <FestivalStatusBadge status={status} />}
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="font-medium">{festival.name}</span>
              <span className="text-sm text-ink-muted">
                {festival.sido} {festival.sigungu}
              </span>
            </span>
            <span className="shrink-0 text-right text-sm text-ink-muted">{formatPeriod(festival, today)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
