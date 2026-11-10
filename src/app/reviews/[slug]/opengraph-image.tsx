// 후기마다 만드는 공유 미리보기 이미지(제목, 지역과 동행)
import { notFound } from "next/navigation";
import { loadContent } from "@/lib/content";
import { formatCompany } from "@/lib/format";
import { OG_SIZE, renderOgImage } from "@/lib/og";
import { SITE_NAME } from "@/lib/site";

export const alt = `${SITE_NAME} 여행후기`;
export const size = OG_SIZE;
export const contentType = "image/png";

export function generateStaticParams() {
  return loadContent().reviews.map((review) => ({ slug: review.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const review = loadContent().reviews.find((r) => r.slug === slug);
  if (!review) notFound();

  return renderOgImage({
    title: review.title,
    caption: `${review.sido} ${review.sigungu}, ${formatCompany(review)}`,
  });
}
