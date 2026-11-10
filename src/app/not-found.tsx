// 없는 주소로 들어왔을 때 보여주는 404 페이지
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto w-full max-w-page px-4 py-16 sm:px-6 sm:py-24">
      <h1 className="text-3xl font-extrabold text-ink sm:text-4xl">
        이 주소에는 페이지가 없어요.
      </h1>
      <p className="mt-4 max-w-prose text-ink-muted">
        주소가 바뀌었거나 지워진 페이지예요. 주소를 다시 확인하거나 메인에서
        다시 찾아보세요.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex min-h-11 items-center rounded-xl bg-primary px-5 font-bold text-white"
      >
        메인으로 가기
      </Link>
    </div>
  );
}
