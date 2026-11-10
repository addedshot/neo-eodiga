// 주소 쿼리로 후기를 거르고 필터, 결과 수, 후기 카드 목록을 그리는 부분(요청 때 렌더링된다)
import Link from "next/link";
import { ReviewCard } from "@/components/ReviewCard";
import { ReviewFilters } from "@/components/ReviewFilters";
import { loadContent } from "@/lib/content";
import { filterReviews, parseFilters, regionOptions } from "@/lib/review-filter";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function ReviewList({ searchParams }: Props) {
  const query = await searchParams;
  const { regions, reviews } = loadContent();
  const options = regionOptions(regions, reviews);
  const filters = parseFilters(query, options);
  const results = filterReviews(reviews, filters);
  const chosen = [
    filters.sido && [filters.sido, filters.sigungu].filter(Boolean).join(" "),
    filters.companion,
    filters.tag,
  ].filter(Boolean);

  return (
    <>
      <ReviewFilters options={options} filters={filters} />
      <div className="mt-8 flex flex-wrap items-center justify-between gap-2">
        <p className="text-lg font-bold">후기 {results.length}개</p>
        {chosen.length > 0 && (
          <Link href="/reviews" scroll={false} className="inline-flex min-h-11 items-center font-bold text-link">
            필터 지우기
          </Link>
        )}
      </div>
      {results.length > 0 ? (
        <ul className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(min(320px,100%),1fr))] gap-5">
          {results.map((review) => (
            <li key={review.slug}>
              <ReviewCard review={review} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-4 rounded-[20px] bg-surface-muted p-6 sm:p-8">
          <p className="text-lg font-bold">조건에 맞는 후기가 없어요.</p>
          <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="고른 조건">
            {chosen.map((label) => (
              <li key={label} className="rounded-full bg-surface px-2.5 py-1 text-[13px] text-ink-soft">
                {label}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-ink-muted">조건을 하나씩 풀거나 필터를 지워 보세요.</p>
          <Link
            href="/reviews"
            scroll={false}
            className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-primary px-5 font-bold text-white"
          >
            필터 지우기
          </Link>
        </div>
      )}
    </>
  );
}
