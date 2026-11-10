// 사이트 이름, 소개 문구, 메뉴 목록을 한 곳에서 관리하는 상수
export const SITE_NAME = "너어디가";

// 운영 주소. 공유 미리보기, canonical, sitemap의 절대 주소에 쓴다.
export const SITE_URL = "https://neo-eodiga.vercel.app";

export const SITE_DESCRIPTION =
  "전국 곳곳을 실제로 다녀온 여행 기록을 모은 곳이에요. 혼자 떠나는 여행도, 커플 데이트도, 친구나 가족 나들이도 모두 담아요.";

// 1단계에 있는 메뉴만 둔다. 헤더와 푸터가 같이 쓴다.
export const NAV_ITEMS = [
  { href: "/reviews", label: "여행후기" },
  { href: "/notices", label: "공지사항" },
  { href: "/guide", label: "이용 안내" },
] as const;
