// 동선 지도와 방문 순서 목록(지도 키나 좌표가 있는 장소가 없으면 목록만 보여준다)
import { KakaoRouteMap, type MapPoint } from "@/components/KakaoRouteMap";
import { RouteList } from "@/components/RouteList";
import type { Place, Review } from "@/lib/content";

type Props = { route: Review["route"]; places: Place[] };

export function RouteMap({ route, places }: Props) {
  const appKey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
  const points: MapPoint[] = route.flatMap((stop, index) => {
    const place = places.find((p) => p.id === stop.place);
    return place?.lat !== undefined && place.lng !== undefined
      ? [{ order: index + 1, name: place.name, lat: place.lat, lng: place.lng }]
      : [];
  });

  return (
    <div className="flex flex-col gap-3.5">
      {appKey && points.length > 0 && <KakaoRouteMap appKey={appKey} points={points} />}
      <RouteList route={route} places={places} />
    </div>
  );
}
