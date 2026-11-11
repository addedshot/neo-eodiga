import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // 후기 목록, 메인과 지역축제(오늘 날짜로 그림), (빌드 때 없던 주소의) 상세 페이지는 요청 때 content 폴더를 읽으므로 서버 번들에 함께 넣는다.
  outputFileTracingIncludes: {
    "/": ["./content/**/*"],
    "/festivals": ["./content/**/*"],
    "/festivals/*": ["./content/**/*"],
    "/reviews": ["./content/**/*"],
    "/reviews/*": ["./content/**/*"],
    "/notices/*": ["./content/**/*"],
    "/guide/*": ["./content/**/*"],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

// Turbopack에서는 remark 플러그인을 문자열 이름으로 넘겨야 한다. frontmatter가 본문에 글자로 나오지 않게 한다.
const withMDX = createMDX({
  options: {
    remarkPlugins: ["remark-frontmatter"],
  },
});

export default withMDX(nextConfig);
