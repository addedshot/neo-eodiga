// 사이트 공통 공유 미리보기 이미지(후기 상세를 뺀 모든 페이지가 쓴다)
import { OG_SIZE, renderOgImage } from "@/lib/og";
import { SITE_NAME } from "@/lib/site";

export const alt = `${SITE_NAME}, 이번 주말 어디 갈까?`;
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return renderOgImage({
    title: "이번 주말,\n어디 갈까?",
    caption: "직접 다녀온 전국 여행 기록",
  });
}
