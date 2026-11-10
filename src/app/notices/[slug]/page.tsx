// 공지 상세 페이지(현재 위치, 제목, 날짜, MDX 본문, 목록으로 가는 링크)
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { MDXContent } from "mdx/types";
import { Breadcrumb } from "@/components/Breadcrumb";
import { loadContent } from "@/lib/content";
import { formatDate } from "@/lib/format";
import { pageMetadata } from "@/lib/metadata";
import { SITE_NAME } from "@/lib/site";

// 모든 공지를 빌드 때 정적 페이지로 만든다. 없는 slug는 요청 때 아래에서 404를 낸다.
export function generateStaticParams() {
  return loadContent().notices.map((notice) => ({ slug: notice.slug }));
}

export async function generateMetadata({ params }: PageProps<"/notices/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const notice = loadContent().notices.find((n) => n.slug === slug);
  return notice
    ? pageMetadata({
        title: notice.title,
        description: `${formatDate(notice.date)}에 올린 ${SITE_NAME} 공지사항이에요.`,
        path: `/notices/${slug}`,
      })
    : {};
}

export default async function NoticePage({ params }: PageProps<"/notices/[slug]">) {
  const { slug } = await params;
  const notice = loadContent().notices.find((n) => n.slug === slug);
  if (!notice) notFound();

  const { default: Body } = (await import(`@content/notices/${slug}.mdx`)) as { default: MDXContent };

  return (
    <div className="mx-auto w-full max-w-page px-4 pb-16 pt-5 sm:px-6">
      <Breadcrumb items={[{ href: "/", label: "홈" }, { href: "/notices", label: "공지사항" }]} />
      <article className="mt-3 max-w-3xl">
        <h1 className="text-[30px] font-extrabold leading-[1.35] sm:text-[38px]">{notice.title}</h1>
        <time dateTime={notice.date} className="mt-3 block text-[15px] text-ink-muted">
          {formatDate(notice.date)}
        </time>
        <div className="mt-6 [&>*:first-child]:mt-0">
          <Body />
        </div>
      </article>
      <Link href="/notices" className="mt-10 inline-flex min-h-11 items-center font-bold text-link">
        공지 목록으로
      </Link>
    </div>
  );
}
