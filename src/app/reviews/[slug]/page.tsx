// 여행후기 상세 페이지(현재 위치, 정보 줄, 동선, MDX 본문, 장소 카드, 실제로 쓴 비용)
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { MDXContent } from "mdx/types";
import { CostSummary } from "@/components/CostSummary";
import { PlaceCard } from "@/components/PlaceCard";
import { RouteMap } from "@/components/RouteMap";
import { loadContent, type Place } from "@/lib/content";
import { formatDate } from "@/lib/format";
import { filterHref } from "@/lib/review-filter";

// 모든 후기를 빌드 때 정적 페이지로 만든다. 없는 slug는 요청 때 아래에서 404를 낸다.
export function generateStaticParams() {
  return loadContent().reviews.map((review) => ({ slug: review.slug }));
}

export async function generateMetadata({ params }: PageProps<"/reviews/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const review = loadContent().reviews.find((r) => r.slug === slug);
  return review ? { title: review.title } : {};
}

export default async function ReviewPage({ params }: PageProps<"/reviews/[slug]">) {
  const { slug } = await params;
  const { reviews, places } = loadContent();
  const review = reviews.find((r) => r.slug === slug);
  if (!review) notFound();

  const { default: Body } = (await import(`@content/reviews/${slug}.mdx`)) as { default: MDXContent };
  const findPlace = (id: string) => places.find((place) => place.id === id);
  // 동선에 나온 장소를 처음 나온 순서대로 한 번씩
  const routePlaces = [...new Set(review.route.map((stop) => stop.place))]
    .map(findPlace)
    .filter((place): place is Place => place !== undefined);
  const region = `${review.sido} ${review.sigungu}`;

  const meta: [string, string | undefined][] = [
    ["다녀온 날", formatDate(review.date)],
    ["누구와", review.companion],
    ["인원", `${review.people}명`],
    ["교통", review.transport],
    ["아이 나이", review.companion === "아이와" ? review.kidAges?.join(", ") : undefined],
  ];

  return (
    <div className="mx-auto w-full max-w-page px-4 pb-16 pt-5 sm:px-6">
      <nav aria-label="현재 위치" className="text-sm text-ink-muted">
        <ol className="flex flex-wrap items-center gap-x-2">
          <li className="flex items-center gap-2">
            <Link href="/" className="inline-flex min-h-11 items-center underline">홈</Link>
            <span aria-hidden="true">›</span>
          </li>
          <li className="flex items-center gap-2">
            <Link href="/reviews" className="inline-flex min-h-11 items-center underline">여행후기</Link>
            <span aria-hidden="true">›</span>
          </li>
          <li>
            <Link
              href={filterHref({}, { sido: review.sido, sigungu: review.sigungu })}
              className="inline-flex min-h-11 items-center underline"
            >
              {region}
            </Link>
          </li>
        </ol>
      </nav>

      <header className="mt-3 flex flex-col gap-3.5">
        <ul className="flex flex-wrap gap-1.5" aria-label="지역과 태그">
          {[region, ...review.tags].map((label) => (
            <li key={label} className="rounded-full bg-surface-muted px-2.5 py-1 text-[13px] text-ink-soft">
              {label}
            </li>
          ))}
        </ul>
        <h1 className="text-[30px] font-extrabold leading-[1.35] sm:text-[38px]">{review.title}</h1>
        <dl className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[15px]">
          {review.author && (
            <div>
              <dt className="sr-only">작성자</dt>
              <dd className="rounded-full bg-point-bg px-2.5 py-0.5 text-xs font-bold text-point-ink">{review.author}</dd>
            </div>
          )}
          {meta.map(
            ([label, value]) =>
              value && (
                <div key={label} className="flex gap-1.5">
                  <dt className="text-ink-muted">{label}</dt>
                  <dd>{value}</dd>
                </div>
              ),
          )}
        </dl>
      </header>

      <div className="mt-8 flex flex-wrap items-start gap-8">
        <article className="flex min-w-0 flex-[999_1_560px] flex-col gap-8">
          <section aria-labelledby="route-heading" className="flex flex-col gap-3.5">
            <h2 id="route-heading" className="text-[22px] font-extrabold">이날의 동선</h2>
            <RouteMap route={review.route} places={places} />
          </section>
          <section aria-labelledby="body-heading">
            <h2 id="body-heading" className="text-[22px] font-extrabold">후기</h2>
            <div className="[&>*:first-child]:mt-3">
              <Body
                components={{
                  PlaceCard: ({ id }: { id: string }) => {
                    const place = findPlace(id);
                    if (!place) throw new Error(`content/reviews/${slug}.mdx: PlaceCard의 장소 id "${id}"가 places.json에 없어요.`);
                    return <PlaceCard place={place} />;
                  },
                  RouteMap: () => <RouteMap route={review.route} places={places} />,
                  CostSummary: () => <CostSummary cost={review.cost} />,
                }}
              />
            </div>
          </section>
        </article>
        <aside aria-label="장소와 비용" className="flex min-w-0 flex-[1_1_320px] flex-col gap-5">
          {routePlaces.map((place) => (
            <PlaceCard key={place.id} place={place} />
          ))}
          <CostSummary cost={review.cost} />
        </aside>
      </div>
    </div>
  );
}
