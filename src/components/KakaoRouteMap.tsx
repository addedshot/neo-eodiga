// 카카오맵에 방문 장소를 번호와 점선으로 표시하는 지도(불러오지 못하면 아무것도 그리지 않는다)
"use client";

import { useEffect, useRef, useState } from "react";

export type MapPoint = { order: number; name: string; lat: number; lng: number };

// 카카오맵 SDK에서 쓰는 부분만 적은 타입(공식 문서 https://apis.map.kakao.com/web/documentation/ 기준)
type LatLng = object;
type KakaoMap = {
  setBounds(bounds: LatLngBounds, ...padding: number[]): void;
};
type LatLngBounds = { extend(latlng: LatLng): void };
type KakaoMaps = {
  load(callback: () => void): void;
  LatLng: new (lat: number, lng: number) => LatLng;
  LatLngBounds: new () => LatLngBounds;
  Map: new (container: HTMLElement, options: { center: LatLng; level?: number; scrollwheel?: boolean }) => KakaoMap;
  CustomOverlay: new (options: { map: KakaoMap; position: LatLng; content: Node; zIndex?: number }) => unknown;
  Polyline: new (options: {
    map: KakaoMap;
    path: LatLng[];
    strokeWeight: number;
    strokeColor: string;
    strokeOpacity: number;
    strokeStyle: string;
  }) => unknown;
};

declare global {
  interface Window {
    kakao?: { maps: KakaoMaps };
  }
}

const SDK_ID = "kakao-map-sdk";
const LOAD_TIMEOUT_MS = 10_000;

// SDK 스크립트를 한 번만 넣고, kakao.maps.load가 끝나면 maps 객체를 돌려준다.
function loadKakaoMaps(appKey: string): Promise<KakaoMaps> {
  return new Promise((resolve, reject) => {
    const whenReady = () => {
      const maps = window.kakao?.maps;
      if (!maps) return reject(new Error("카카오맵 SDK가 없어요."));
      maps.load(() => resolve(maps));
    };
    if (window.kakao?.maps) return whenReady();
    let script = document.getElementById(SDK_ID) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = SDK_ID;
      script.async = true;
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(appKey)}&autoload=false`;
      document.head.appendChild(script);
    }
    script.addEventListener("load", whenReady, { once: true });
    script.addEventListener("error", () => reject(new Error("카카오맵 SDK를 불러오지 못했어요.")), { once: true });
  });
}

function markerElement(order: number): HTMLElement {
  const marker = document.createElement("span");
  marker.setAttribute("aria-hidden", "true");
  marker.className =
    "flex size-[34px] items-center justify-center rounded-full border-[3px] border-white bg-primary font-extrabold text-white";
  marker.textContent = String(order);
  return marker;
}

export function KakaoRouteMap({ appKey, points }: { appKey: string; points: MapPoint[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");
  // 같은 좌표 목록이면 지도를 다시 만들지 않는다.
  const pointsKey = JSON.stringify(points);

  useEffect(() => {
    const stops = JSON.parse(pointsKey) as MapPoint[];
    let cancelled = false;
    const timer = setTimeout(() => {
      if (!cancelled) setStatus((current) => (current === "loading" ? "failed" : current));
    }, LOAD_TIMEOUT_MS);

    loadKakaoMaps(appKey)
      .then((maps) => {
        const container = mapRef.current;
        if (cancelled || !container) return;
        const positions = stops.map((stop) => new maps.LatLng(stop.lat, stop.lng));
        // 기본 중심 좌표 없이 첫 장소에서 시작하고, 여러 곳이면 모두 보이게 범위를 잡는다.
        const map = new maps.Map(container, { center: positions[0], level: 4, scrollwheel: false });
        if (positions.length > 1) {
          const bounds = new maps.LatLngBounds();
          positions.forEach((position) => bounds.extend(position));
          map.setBounds(bounds, 48);
          new maps.Polyline({
            map,
            path: positions,
            strokeWeight: 3,
            strokeColor: getComputedStyle(document.documentElement).getPropertyValue("--color-primary").trim(),
            strokeOpacity: 0.9,
            strokeStyle: "shortdash",
          });
        }
        stops.forEach((stop, index) => {
          new maps.CustomOverlay({ map, position: positions[index], content: markerElement(stop.order), zIndex: 1 });
        });
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("failed");
      });

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [appKey, pointsKey]);

  if (status === "failed") return null;

  return (
    <div className="relative h-[260px] overflow-hidden rounded-[20px] border border-line bg-surface-muted sm:h-[340px]">
      <div ref={mapRef} role="img" aria-label="방문 장소를 표시한 지도. 순서와 장소는 아래 목록에 있어요." className="absolute inset-0" />
      {status === "loading" && (
        <p className="absolute inset-0 flex items-center justify-center text-sm text-ink-muted">지도를 불러오고 있어요.</p>
      )}
    </div>
  );
}
