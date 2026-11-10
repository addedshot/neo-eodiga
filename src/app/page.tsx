// 메인 페이지 자리(STEP 09에서 히어로와 섹션을 채운다)
import { SITE_NAME } from "@/lib/site";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-16">
      <h1 className="text-4xl font-extrabold text-ink">{SITE_NAME}</h1>
      <p className="mt-4 text-ink-muted">이번 주말, 어디 갈까?</p>
    </main>
  );
}
