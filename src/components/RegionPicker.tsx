// 출발 지역 고르기: 시도를 고른 뒤 시군구를 고른다. "내 위치로 찾기"는 브라우저 위치를 기기 안에서만 써서 가장 가까운 시군구를 고른다.
// 자바스크립트가 없으면 시군구 칸에 전국 목록이 시도별로 묶여 나온다(그대로 고를 수 있다).
"use client";

import { useState, useSyncExternalStore } from "react";

type Region = { code: string; sido: string; sigungu: string };
type Props = { regions: Region[]; centers: Record<string, { lat: number; lng: number }>; defaultCode?: string };

// 서버에서 그릴 때는 false, 브라우저에서 화면이 붙은 뒤에는 true
const useHydrated = () =>
  useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

function nearestRegion(lat: number, lng: number, regions: Region[], centers: Props["centers"]): Region | undefined {
  let best: Region | undefined;
  let bestDistance = Infinity;
  for (const r of regions) {
    const c = centers[r.code];
    if (!c) continue;
    // 가까운 곳을 고르는 데는 위도·경도 차이의 제곱합으로 충분하다(경도는 위도에 맞춰 줄인다).
    const d = (c.lat - lat) ** 2 + ((c.lng - lng) * Math.cos((lat * Math.PI) / 180)) ** 2;
    if (d < bestDistance) {
      bestDistance = d;
      best = r;
    }
  }
  return best;
}

export function RegionPicker({ regions, centers, defaultCode }: Props) {
  const hydrated = useHydrated();
  const initial = regions.find((r) => r.code === defaultCode);
  const [sido, setSido] = useState(initial?.sido ?? "");
  const [code, setCode] = useState(initial?.code ?? "");
  const [status, setStatus] = useState("");
  const sidoList = [...new Set(regions.map((r) => r.sido))];
  const select = "h-12 w-full rounded-xl border border-line-strong bg-surface px-3 text-[16px]";

  function useMyLocation() {
    if (!navigator.geolocation) {
      setStatus("이 브라우저에서는 위치를 쓸 수 없어요. 직접 골라 주세요.");
      return;
    }
    setStatus("위치를 찾고 있어요.");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const r = nearestRegion(coords.latitude, coords.longitude, regions, centers);
        if (!r) return setStatus("가까운 시군구를 찾지 못했어요. 직접 골라 주세요.");
        setSido(r.sido);
        setCode(r.code);
        setStatus(`${r.sido} ${r.sigungu}(으)로 골랐어요. 위치는 이 기기 안에서만 썼어요.`);
      },
      () => setStatus("위치를 받지 못했어요. 위치 권한을 허용하거나 직접 골라 주세요."),
      { maximumAge: 600000, timeout: 10000 },
    );
  }

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-[15px] font-extrabold">어디에서 출발하나요?</legend>
      <div className="mt-2 grid gap-2 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        {hydrated && (
          <label className="flex flex-col gap-1">
            <span className="sr-only">시도</span>
            <select
              value={sido}
              onChange={(e) => {
                setSido(e.target.value);
                setCode("");
              }}
              className={select}
            >
              <option value="">시도 고르기</option>
              {sidoList.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="flex flex-col gap-1">
          <span className="sr-only">시군구</span>
          <select name="from" required value={code} onChange={(e) => setCode(e.target.value)} disabled={hydrated && !sido} className={`${select} disabled:bg-surface-muted disabled:text-ink-muted`}>
            <option value="" disabled>
              {hydrated && !sido ? "시도를 먼저 골라 주세요" : "시군구 고르기"}
            </option>
            {hydrated
              ? regions
                  .filter((r) => r.sido === sido)
                  .map((r) => (
                    <option key={r.code} value={r.code}>
                      {r.sigungu}
                    </option>
                  ))
              : sidoList.map((s) => (
                  <optgroup key={s} label={s}>
                    {regions
                      .filter((r) => r.sido === s)
                      .map((r) => (
                        <option key={r.code} value={r.code}>
                          {r.sido} {r.sigungu}
                        </option>
                      ))}
                  </optgroup>
                ))}
          </select>
        </label>
      </div>
      {hydrated && (
        <button type="button" onClick={useMyLocation} className="inline-flex min-h-11 items-center self-start rounded-xl border border-line-strong px-4 text-[14px] font-bold text-ink-soft">
          내 위치로 찾기
        </button>
      )}
      <p className="text-[13px] text-ink-muted" aria-live="polite">
        {status || "정확한 주소는 받지 않아요. 고른 시군구도 저장하지 않아요."}
      </p>
    </fieldset>
  );
}
