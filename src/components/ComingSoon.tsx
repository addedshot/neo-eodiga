// 아직 만들지 않은 메뉴의 "준비 중" 안내(메뉴 이름, 앞으로 담을 내용, 지금 볼 수 있는 곳)
import Link from "next/link";

export function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <div className="mx-auto w-full max-w-page px-4 pb-16 pt-8 sm:px-6">
      <h1 className="text-3xl font-extrabold sm:text-[38px] sm:leading-[1.35]">{title}</h1>
      <div className="mt-8 max-w-xl rounded-[20px] bg-surface-muted p-6 sm:p-8">
        <p className="text-lg font-bold">준비 중이에요.</p>
        <p className="mt-2 text-ink-muted">{description}</p>
        <Link
          href="/reviews"
          className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-primary px-5 font-bold text-white"
        >
          여행후기 보기
        </Link>
      </div>
    </div>
  );
}
