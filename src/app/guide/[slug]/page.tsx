// 이용 안내 상세 페이지(현재 위치, 제목, MDX 본문, 다른 안내로 가는 링크)
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { MDXContent } from "mdx/types";
import { Breadcrumb } from "@/components/Breadcrumb";
import { GuideLinks } from "@/components/GuideLinks";
import { loadContent } from "@/lib/content";
import { pageMetadata } from "@/lib/metadata";
import { SITE_NAME } from "@/lib/site";

// 모든 안내를 빌드 때 정적 페이지로 만든다. 없는 slug는 요청 때 아래에서 404를 낸다.
export function generateStaticParams() {
  return loadContent().guides.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: PageProps<"/guide/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const guide = loadContent().guides.find((g) => g.slug === slug);
  return guide
    ? pageMetadata({ title: guide.title, description: `${SITE_NAME} 이용 안내 문서예요.`, path: `/guide/${slug}` })
    : {};
}

export default async function GuideDetailPage({ params }: PageProps<"/guide/[slug]">) {
  const { slug } = await params;
  const { guides } = loadContent();
  const guide = guides.find((g) => g.slug === slug);
  if (!guide) notFound();

  const { default: Body } = (await import(`@content/guide/${slug}.mdx`)) as { default: MDXContent };
  const others = guides.filter((g) => g.slug !== slug);

  return (
    <div className="mx-auto w-full max-w-page px-4 pb-16 pt-5 sm:px-6">
      <Breadcrumb items={[{ href: "/", label: "홈" }, { href: "/guide", label: "이용 안내" }]} />
      <article className="mt-3 max-w-3xl">
        <h1 className="text-[30px] font-extrabold leading-[1.35] sm:text-[38px]">{guide.title}</h1>
        <div className="mt-6 [&>*:first-child]:mt-0">
          <Body />
        </div>
      </article>
      {others.length > 0 && (
        <nav aria-labelledby="other-guides" className="mt-12 max-w-xl rounded-[20px] bg-surface-muted p-5 sm:p-6">
          <h2 id="other-guides" className="text-lg font-extrabold">다른 안내</h2>
          <div className="mt-3">
            <GuideLinks guides={others} />
          </div>
        </nav>
      )}
    </div>
  );
}
