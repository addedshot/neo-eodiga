// 여행후기 목록과 메인에서 쓰는 후기 카드(대표 사진, 지역·태그, 제목, 작성자, 동행)
import Image from "next/image";
import Link from "next/link";
import type { Review } from "@/lib/content";
import { formatCompany, formatDate } from "@/lib/format";

export function ReviewCard({ review }: { review: Review }) {
  return (
    <Link
      href={`/reviews/${review.slug}`}
      className="flex h-full flex-col overflow-hidden rounded-[20px] border border-line bg-surface text-ink hover:border-primary"
    >
      {review.cover ? (
        <div className="relative h-[190px]">
          <Image src={review.cover} alt="" fill sizes="(min-width: 768px) 400px, 100vw" className="object-cover" />
        </div>
      ) : (
        <div className="flex h-[190px] items-center justify-center bg-surface-accent text-sm font-bold text-link">
          사진
        </div>
      )}
      <div className="flex flex-col gap-2.5 p-5">
        <ul className="flex flex-wrap gap-1.5" aria-label="지역과 태그">
          {[`${review.sido} ${review.sigungu}`, ...review.tags].map((label) => (
            <li key={label} className="rounded-full bg-surface-muted px-2.5 py-1 text-[13px] text-ink-soft">
              {label}
            </li>
          ))}
        </ul>
        <h2 className="text-[19px] font-extrabold leading-[1.45]">{review.title}</h2>
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-muted">
          {review.author && (
            <span className="rounded-full bg-point-bg px-2 py-0.5 text-xs font-bold text-point-ink">
              {review.author}
            </span>
          )}
          <span>{formatCompany(review)}</span>
          <span>{formatDate(review.date)} 다녀옴</span>
        </p>
      </div>
    </Link>
  );
}
