// 검색엔진에 알려줄 주소 목록(sitemap.xml). 후기 date는 다녀온 날이라 수정일(lastModified)로 쓰지 않는다.
import type { MetadataRoute } from "next";
import { loadContent } from "@/lib/content";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const { reviews, notices, guides } = loadContent();
  const paths = [
    "/",
    "/reviews",
    "/notices",
    "/guide",
    ...reviews.map((review) => `/reviews/${review.slug}`),
    ...notices.map((notice) => `/notices/${notice.slug}`),
    ...guides.map((guide) => `/guide/${guide.slug}`),
  ];
  return paths.map((path) => ({ url: `${SITE_URL}${path === "/" ? "" : path}` }));
}
