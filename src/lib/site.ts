// 사이트 이름, 소개 문구, 메뉴 목록을 한 곳에서 관리하는 상수
export const SITE_NAME = "너어디가";

// 운영 주소. 공유 미리보기, canonical, sitemap의 절대 주소에 쓴다.
export const SITE_URL = "https://neo-eodiga.vercel.app";

export const SITE_DESCRIPTION =
  "전국 곳곳을 실제로 다녀온 여행 기록을 모은 곳이에요. 혼자 떠나는 여행도, 커플 데이트도, 친구나 가족 나들이도 모두 담아요.";

// 헤더 주 메뉴(순서는 사용자가 정함). 아직 만들지 않은 메뉴는 "준비 중" 페이지로 간다.
export const NAV_ITEMS = [
  { href: "/festivals", label: "지역축제" },
  { href: "/reviews", label: "여행후기" },
  { href: "/recommend", label: "여행추천" },
  { href: "/map", label: "여행지도" },
] as const;

// 푸터 메뉴. 공지사항과 이용 안내는 헤더가 아니라 메인과 푸터에 둔다.
export const FOOTER_ITEMS = [
  { href: "/notices", label: "공지사항" },
  { href: "/guide", label: "이용 안내" },
] as const;
