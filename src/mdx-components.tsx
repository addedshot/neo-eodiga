// MDX 본문(후기, 공지, 이용 안내)의 글자 모양(@next/mdx를 App Router에서 쓰려면 반드시 있어야 하는 파일)
import type { MDXComponents } from "mdx/types";

const components: MDXComponents = {
  h2: (props) => <h2 className="mb-3 mt-10 text-[22px] font-extrabold leading-snug" {...props} />,
  h3: (props) => <h3 className="mb-2 mt-8 text-lg font-bold leading-snug" {...props} />,
  p: (props) => <p className="my-4 text-[17px] leading-[1.85]" {...props} />,
  ul: (props) => <ul className="my-4 list-disc pl-6 text-[17px] leading-[1.85]" {...props} />,
  ol: (props) => <ol className="my-4 list-decimal pl-6 text-[17px] leading-[1.85]" {...props} />,
  a: (props) => <a className="text-link underline" {...props} />,
  strong: (props) => <strong className="font-bold" {...props} />,
};

export function useMDXComponents(): MDXComponents {
  return components;
}
