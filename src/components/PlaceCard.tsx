// 장소 카드(직접 가봄 배지, 기본 항목은 값이 없으면 "정보 없음", 추천 동행·유모차·수유실은 값이 있을 때만)
import type { Place } from "@/lib/content";

export function PlaceCard({ place }: { place: Place }) {
  const basic: [string, string | undefined][] = [
    ["운영시간", place.hours],
    ["주차", place.parking],
    ["예약", place.reservation],
    ["추천 소요", place.stayTime],
  ];
  const optional: [string, string | undefined][] = [
    ["추천 동행", place.goodFor?.join(", ")],
    ["유모차", place.stroller],
    ["수유실", place.nursingRoom],
  ];

  return (
    <section aria-label={place.name} className="flex flex-col gap-3.5 rounded-[20px] border border-line bg-surface p-[22px]">
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-[19px] font-extrabold leading-snug">
          {place.name}
        </h2>
        {place.visited && (
          <span className="shrink-0 rounded-full bg-visited-bg px-2.5 py-0.5 text-xs font-bold text-visited-ink">
            직접 가봄
          </span>
        )}
      </div>
      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2.5 text-[15px]">
        {basic.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-ink-muted">{label}</dt>
            <dd className={value ? "" : "text-ink-muted"}>{value ?? "정보 없음"}</dd>
          </div>
        ))}
        {optional.map(
          ([label, value]) =>
            value && (
              <div key={label} className="contents">
                <dt className="text-ink-muted">{label}</dt>
                <dd>{value}</dd>
              </div>
            ),
        )}
      </dl>
    </section>
  );
}
