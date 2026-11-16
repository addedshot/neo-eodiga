// 먹을 곳 목록(대표 메뉴, 영업 시간, 쉬는 날, 주차, 공식 표시). 상세는 관광공사 음식점 자료이고, 공식 표시는 지정 자료로 붙인 것이다(맛 평가가 아니다).
import { formatDistance } from "@/lib/festivals";
import { foodDetailOf } from "@/lib/food-details";

type Food = { id?: string; name: string; distance: number; address?: string; badges?: string[] };

export function FoodList({ foods }: { foods: Food[] }) {
  return (
    <ul className="flex flex-col divide-y divide-line">
      {foods.map((f) => {
        const d = foodDetailOf(f.id);
        const rows: [string, string | undefined][] = [
          ["영업 시간", d?.openTime],
          ["쉬는 날", d?.restDate],
          ["주차", d?.parking],
          ["포장", d?.packing],
          ["예약", d?.reservation],
        ];
        const shown = rows.filter(([, v]) => v);
        return (
          <li key={`${f.name}-${f.distance}`} className="flex flex-col gap-1.5 py-3 first:pt-0 last:pb-0">
            <p className="text-[16px]">
              <span className="font-bold">{f.name}</span>
              <span className="ml-1.5 text-[14px] text-ink-muted">{formatDistance(f.distance)}</span>
            </p>
            <div className="flex flex-wrap gap-1">
              {f.badges?.length ? (
                f.badges.map((b) => (
                  <span key={b} className="rounded-md border border-line-strong bg-surface-muted px-1.5 py-px text-[12px] font-bold text-ink-soft">
                    {b}
                  </span>
                ))
              ) : (
                <span className="text-[12px] text-ink-muted">공식 표시 없음</span>
              )}
            </div>
            {d?.firstMenu && (
              <p className="text-[15px]">
                <span className="text-ink-muted">대표 메뉴 </span>
                <span className="font-bold">{d.firstMenu}</span>
                {d.treatMenu && d.treatMenu !== d.firstMenu && <span className="text-ink-soft">, 그 밖에 {d.treatMenu}</span>}
              </p>
            )}
            {shown.length > 0 && (
              <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-0.5 text-[13px]">
                {shown.map(([label, value]) => (
                  <div key={label} className="contents">
                    <dt className="text-ink-muted">{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            )}
            {!d && <p className="text-[13px] text-ink-muted">메뉴와 영업 시간 자료를 준비하고 있어요.</p>}
            {f.address && <p className="text-[13px] text-ink-muted">{f.address}</p>}
          </li>
        );
      })}
    </ul>
  );
}
