// MDX 본문에서 쓸 공통 컴포넌트 목록(@next/mdx를 App Router에서 쓰려면 반드시 있어야 하는 파일)
import type { MDXComponents } from "mdx/types";

const components: MDXComponents = {};

export function useMDXComponents(): MDXComponents {
  return components;
}
