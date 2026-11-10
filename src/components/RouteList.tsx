// 후기의 방문 순서 목록(번호, 장소 이름, 분류와 메모, 시각)
import type { Place, Review } from "@/lib/content";

type Props = { route: Review["route"]; places: Place[] };

export function RouteList({ route, places }: Props) {
  return (
    <ol className="flex flex-col gap-2.5">
      {route.map((stop, index) => {
        const place = places.find((p) => p.id === stop.place);
        const detail = [place?.category, stop.note].filter(Boolean).join(" · ");
        return (
          <li
            key={`${stop.place}-${index}`}
            className="flex items-center gap-3.5 rounded-[14px] border border-line px-4 py-3.5"
          >
            <span
              aria-hidden="true"
              className="flex size-[30px] shrink-0 items-center justify-center rounded-full bg-surface-accent font-extrabold text-link"
            >
              {index + 1}
            </span>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="font-bold">{place?.name ?? stop.place}</span>
              {detail && <span className="text-sm text-ink-muted">{detail}</span>}
            </div>
            {stop.time && <span className="text-sm text-ink-muted">{stop.time}</span>}
          </li>
        );
      })}
    </ol>
  );
}
