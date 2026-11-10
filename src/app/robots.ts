// 검색엔진 수집 규칙(robots.txt). 사이트 전체를 허용하고 sitemap 주소를 알려준다.
import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
