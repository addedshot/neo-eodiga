// 메인 페이지(히어로, 공지 최근 4개와 처음 오셨나요?, 최근 여행후기)
import type { Metadata } from "next";
import Link from "next/link";
import { GuideLinks } from "@/components/GuideLinks";
import { NoticeList } from "@/components/NoticeList";
import { ReviewCard } from "@/components/ReviewCard";
import { FILTER_TAGS, loadContent } from "@/lib/content";
import { pageMetadata } from "@/lib/metadata";
import { filterHref, filterReviews } from "@/lib/review-filter";
import { SITE_DESCRIPTION } from "@/lib/site";

export const metadata: Metadata = pageMetadata({ description: SITE_DESCRIPTION, path: "/" });

export default function Home() {
  const { notices, guides, reviews } = loadContent();
  const recentReviews = filterReviews(reviews, {}).slice(0, 3);

  return (
    <div className="mx-auto w-full max-w-page px-4 pb-16 pt-8 sm:px-6">
      <section className="rounded-[28px] bg-surface-accent px-6 py-8 sm:px-12 sm:py-14">
        <h1 className="text-[34px] font-extrabold leading-[1.3] sm:text-[44px]">
          이번 주말,
          <br />
          어디 갈까?
        </h1>
        <p className="mt-3.5 max-w-xl text-lg leading-[1.7] text-ink-soft">
          전국 곳곳을 직접 다녀온 여행 기록이에요. 지역과 함께 가는 사람, 태그로 나에게 맞는 후기를 찾아보세요.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/reviews"
            className="inline-flex min-h-[52px] items-center rounded-xl bg-primary px-6 text-[17px] font-bold text-white"
          >
            여행후기 보기
          </Link>
          <Link
            href="/guide"
            className="inline-flex min-h-[52px] items-center rounded-xl border border-primary bg-surface px-6 text-[17px] font-bold text-link"
          >
            이용 안내
          </Link>
        </div>
      </section>

      <section aria-label="공지와 이용 안내" className="mt-14 flex flex-wrap items-stretch gap-5">
        <div className="min-w-0 flex-[999_1_520px] rounded-[20px] border border-line px-6 py-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-extrabold">공지사항</h2>
            <Link
              href="/notices"
              aria-label="공지사항 더보기"
              className="inline-flex min-h-11 items-center text-sm font-bold text-link"
            >
              더보기
            </Link>
          </div>
          {notices.length > 0 ? (
            <NoticeList notices={notices.slice(0, 4)} />
          ) : (
            <p className="py-3 text-ink-muted">아직 공지가 없어요.</p>
          )}
        </div>
        <div className="min-w-0 flex-[1_1_300px] rounded-[20px] bg-surface-muted px-6 py-5">
          <h2 className="mb-3 text-xl font-extrabold">처음 오셨나요?</h2>
          <GuideLinks guides={guides} />
        </div>
      </section>

      <section aria-labelledby="recent-reviews" className="mt-14">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 id="recent-reviews" className="text-[26px] font-extrabold">최근 여행후기</h2>
          <Link href="/reviews" className="inline-flex min-h-11 items-center text-[15px] font-bold text-link">
            전체 후기 보기
          </Link>
        </div>
        <ul aria-label="태그로 후기 찾기" className="mt-4 flex flex-wrap gap-2">
          {FILTER_TAGS.map((tag) => (
            <li key={tag}>
              <Link
                href={filterHref({}, { tag })}
                className="inline-flex min-h-11 items-center rounded-full border border-line-strong bg-surface px-4 text-[15px] font-medium text-ink-soft hover:border-primary"
              >
                {tag}
              </Link>
            </li>
          ))}
        </ul>
        {recentReviews.length > 0 ? (
          <ul className="mt-5 grid grid-cols-[repeat(auto-fill,minmax(min(320px,100%),1fr))] gap-5">
            {recentReviews.map((review) => (
              <li key={review.slug}>
                <ReviewCard review={review} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-5 text-ink-muted">아직 후기가 없어요.</p>
        )}
      </section>
    </div>
  );
}
