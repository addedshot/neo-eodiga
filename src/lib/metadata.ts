// 페이지별 메타데이터(제목, 설명, canonical, 공유 정보)를 같은 모양으로 만드는 함수
import type { Metadata } from "next";
import { OG_SIZE } from "@/lib/og";
import { SITE_NAME } from "@/lib/site";

// 페이지에서 openGraph를 정하면 레이아웃의 openGraph(사이트 공통 이미지 포함)를 통째로 대신하므로,
// 공통 값과 공유 이미지를 여기서 함께 넣는다. 이미지 주소를 주지 않으면 사이트 공통 이미지를 쓴다.
// (같은 폴더의 opengraph-image 파일보다 여기서 정한 images가 우선해서, 후기 상세는 자기 이미지 주소를 넘긴다.)
type Options = { title?: string; description: string; path: string; image?: { url: string; alt: string } };

export function pageMetadata({ title, description, path, image }: Options): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "ko_KR",
      title: title ?? SITE_NAME,
      description,
      url: path,
      images: [{ ...(image ?? { url: "/opengraph-image", alt: `${SITE_NAME}, 이번 주말 어디 갈까?` }), ...OG_SIZE }],
    },
  };
}
