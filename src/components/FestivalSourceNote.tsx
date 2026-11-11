// 지역축제 자료 출처와 받은 날 안내(공공데이터포털 전국문화축제표준데이터)
import { loadContent } from "@/lib/content";
import { formatDate } from "@/lib/format";

export function FestivalSourceNote() {
  const { festivalSource } = loadContent();
  return (
    <p className="mt-10 text-sm text-ink-muted">
      축제 정보는{" "}
      <a href={festivalSource.url} className="text-link underline" target="_blank" rel="noopener noreferrer">
        공공데이터포털 전국문화축제표준데이터
      </a>
      에서 {formatDate(festivalSource.fetchedOn)}에 받았어요. 일정은 바뀔 수 있으니 가기 전에 주최 측 안내를 확인해 주세요.
    </p>
  );
}
