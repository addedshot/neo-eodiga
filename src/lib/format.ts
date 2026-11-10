// 화면에 보여줄 값(날짜, 동행과 인원)을 한국어 문장으로 바꾸는 함수
import type { Review } from "@/lib/content";

// "2026-11-08" → "2026년 11월 8일"
export function formatDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  return `${year}년 ${month}월 ${day}일`;
}

// 12000 → "12,000원"
export function formatWon(amount: number): string {
  return `${amount.toLocaleString("ko-KR")}원`;
}

// 검색 결과와 공유 미리보기에 쓰는 후기 설명. 예: "부산 수영구, 2026년 11월 8일, 아이와 4명이 다녀온 여행 기록이에요."
export function describeReview(review: Pick<Review, "sido" | "sigungu" | "date" | "companion" | "people">): string {
  const who = review.companion === "혼자" ? "혼자" : `${review.companion} ${review.people}명이`;
  return `${review.sido} ${review.sigungu}, ${formatDate(review.date)}, ${who} 다녀온 여행 기록이에요.`;
}

// 혼자는 인원을 붙이지 않는다. 예: "혼자", "아이와 4명"
export function formatCompany(review: Pick<Review, "companion" | "people">): string {
  return review.companion === "혼자" ? "혼자" : `${review.companion} ${review.people}명`;
}
