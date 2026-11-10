// 여행후기 목록 필터(지역, 누구와, 태그)의 선택지를 만들고, 주소 쿼리를 읽어 후기를 거르는 함수
import { COMPANIONS, FILTER_TAGS, type Companion, type Region, type Review } from "@/lib/content";

export type FilterTag = (typeof FILTER_TAGS)[number];

export type ReviewFilters = {
  sido?: string;
  sigungu?: string;
  companion?: Companion;
  tag?: FilterTag;
};

export type SidoOption = {
  name: string;
  count: number;
  sigungus: { name: string; count: number }[];
};

type Query = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

// 후기가 있는 시도와 그 아래 시군구만, regions.json 순서대로 후기 수와 함께 돌려준다.
export function regionOptions(regions: Region[], reviews: Review[]): SidoOption[] {
  const counts = new Map<string, number>();
  for (const review of reviews) {
    const key = `${review.sido}/${review.sigungu}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const options: SidoOption[] = [];
  for (const region of regions) {
    const count = counts.get(`${region.sido}/${region.sigungu}`);
    if (!count) continue;
    let sido = options.find((option) => option.name === region.sido);
    if (!sido) {
      sido = { name: region.sido, count: 0, sigungus: [] };
      options.push(sido);
    }
    sido.count += count;
    sido.sigungus.push({ name: region.sigungu, count });
  }
  return options;
}

// 선택지에 없는 값은 무시한다. 시군구는 고른 시도 아래에 있을 때만 쓴다.
export function parseFilters(query: Query, options: SidoOption[]): ReviewFilters {
  const sido = options.find((option) => option.name === first(query.sido));
  return {
    sido: sido?.name,
    sigungu: sido?.sigungus.find((option) => option.name === first(query.sigungu))?.name,
    companion: COMPANIONS.find((value) => value === first(query.companion)),
    tag: FILTER_TAGS.find((value) => value === first(query.tag)),
  };
}

// 조건에 맞는 후기를 다녀온 날 최신순으로 돌려준다.
export function filterReviews(reviews: Review[], filters: ReviewFilters): Review[] {
  return reviews
    .filter(
      (review) =>
        (!filters.sido || review.sido === filters.sido) &&
        (!filters.sigungu || review.sigungu === filters.sigungu) &&
        (!filters.companion || review.companion === filters.companion) &&
        (!filters.tag || review.tags.includes(filters.tag)),
    )
    .sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
}

// 지금 필터에서 일부 값만 바꾼 목록 주소를 만든다. 시도를 바꾸면 시군구는 지운다.
export function filterHref(filters: ReviewFilters, change: Partial<Record<keyof ReviewFilters, string>>): string {
  const next: Record<string, string | undefined> = { ...filters, ...change };
  if ("sido" in change) next.sigungu = change.sigungu;
  const params = new URLSearchParams();
  for (const key of ["sido", "sigungu", "companion", "tag"] as const) {
    const value = next[key];
    if (value) params.set(key, value);
  }
  const query = params.toString();
  return query ? `/reviews?${query}` : "/reviews";
}
