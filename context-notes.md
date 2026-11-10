# 너어디가 작업 메모

결정한 것, 그 이유, 자료 출처, 아직 열린 질문을 적는다. 새 결정은 위에 추가한다.

## STEP 01 프로젝트 생성 (2026-11-10)
- `create-next-app@16.4.6`을 현재 폴더에서 실행했더니 아래 메시지로 멈췄다. `.claude` 폴더는 문제 되지 않았다.
  ```
  The directory pro contains files that could conflict:
    checklist.md
    context-notes.md
    plan.md
  ```
- 세 문서를 잠시 작업 폴더 밖으로 옮기고 생성한 뒤 다시 되돌렸다. 하위 폴더에 만들고 옮기는 방법보다 단순하고, 생성기가 만든 설정을 그대로 쓸 수 있다.
- `--disable-git`으로 생성기가 자동 커밋을 만들지 않게 했다. 커밋은 시맨틱 커밋으로 직접 나눈다.
- 생성 옵션은 TypeScript, Tailwind, ESLint, App Router, `src` 폴더, npm, `@/*` 경로 별칭, 나머지는 기본값(`--yes`)이다.
- 생성 결과는 Next.js 16.4.6, React 19.3.0, Tailwind 4.3.3이다.
  - Tailwind는 PostCSS 대신 `@tailwindcss/turbopack` 로더로 붙어 있다(`next.config.ts`). 내장 문서의 CSS 안내는 PostCSS 방식이지만 생성기 설정을 그대로 둔다.
  - `next.config.ts`에 `cacheComponents`, `partialPrefetching`이 기본으로 켜져 있다. 1단계는 정적 콘텐츠라 그대로 둔다.
  - `AGENTS.md`가 생성되었다. `next dev`가 이 블록을 다시 써 넣으므로 그대로 커밋한다.
- 생성 시 `npm audit`이 moderate 취약점 7개를, `eslint@9.39.5` 지원 종료 경고를 보였다. 생성기 기본 의존성이라 지금은 손대지 않는다.
- 패키지 이름은 `npm pkg set name=neo-eodiga`로 바꾸고 lock 파일도 갱신했다.
- 테마 색 토큰 이름은 `globals.css`의 `@theme`에 있다. 바탕(`surface`, `surface-muted`, `surface-accent`), 글자(`ink`, `ink-muted`, `link`), 주 색(`primary`), 포인트(`sun`), 배지(`point-bg`, `point-ink`, `visited-bg`, `visited-ink`), 테두리(`line`)다. 예를 들면 `bg-surface-muted`, `text-ink`, `border-line`처럼 쓴다.
- 다크 모드 색은 스킬에 없어서 생성기의 다크 모드 설정을 지웠다.
- Noto Sans KR은 굵기 배열 `["400","500","700","800"]`로 불러온다. Next 폰트 데이터에 `korean` 서브셋이 없어서 `latin`만 미리 불러오고, 한글 글자는 필요할 때 나눠 받는다.
- 생성기의 `.gitignore`에 `.env*`가 있어서 나중에 만들 `.env.example`도 무시된다. STEP 07에서 `!.env.example`을 더한다.

## STEP 02 결정 (2026-11-10)
- 사용자가 디자인 계획을 추천안대로 확정했다.
- 좁은 화면 메뉴는 메뉴 버튼 대신 두 번째 줄로 줄바꿈한다. 메뉴가 셋뿐이라 다 보이게 두는 편이 낫다.
- 현재 메뉴에 밑줄과 `aria-current`를 단다. `cacheComponents`에서 `usePathname`이 동적 주소에서 멈출 수 있어 `Suspense`로 감싼다(내장 문서 `use-pathname.md`의 Cache Components 항목).
- 푸터에 연락 방법은 아직 넣지 않는다. 방법이 정해지면 넣는다.
- 로고는 처음에 글자 오른쪽 위에 채운 원을 두었으나, 사용자가 보낸 시안(해 아이콘이 이름 왼쪽)에 맞춰 바꿨다. `sun` 색 선 해 아이콘(24px, 선 굵기 2) 다음에 굵기 800의 "너어디가"를 둔다. 시안 이미지의 글자는 예전 이름 "주말어디가"라서 글자는 "너어디가"를 유지했다.
- 404는 `app/not-found.tsx` 하나로 처리한다. 내장 문서상 루트 not-found가 없는 주소 전체를 맡고, 실험 기능인 `global-not-found`는 필요 없다.

## STEP 02 확인 중 알게 된 것 (2026-11-10)
- 404 페이지에서는 현재 메뉴 표시가 붙지 않는다. 없는 주소는 미리 만든 `/_not-found` 페이지로 응답하기 때문이다. 404는 해당 메뉴 페이지가 아니므로 이대로 둔다.
- 현재 메뉴 표시는 임시 페이지 `/reviews`, `/reviews/sample`을 만들어 개발 서버에서 확인한 뒤 지웠다.
- 임시 페이지를 지운 뒤 `npm run build`가 `.next/dev/types/validator.ts(65,39): error TS2307: Cannot find module '../../../src/app/reviews/page.js'`로 실패했다. `tsconfig.json`이 개발 서버가 만든 `.next/dev/types`를 포함하는데, 지운 페이지 정보가 남아 있었다. `.next/dev`를 지우고 다시 빌드해서 통과했다. 페이지를 지운 뒤 빌드가 이렇게 실패하면 같은 방법을 쓴다.

## Vercel 배포 (2026-11-10)
- 사용자가 Vercel Hobby 팀 `ccjy1293-5713's projects`에 프로젝트 `neo-eodiga`를 만들고 GitHub 저장소를 연결했다.
- GitHub 앱 권한은 `addedshot/neo-eodiga` 저장소 하나에만 주었다.
- 운영 주소는 https://neo-eodiga.vercel.app 이다. `main`에 push하면 자동으로 배포된다.
- 첫 배포에서 서체 Noto Sans KR, 제목 굵기 800, 본문 글자색 `#1B2733`, 보조 글자색 `#5B6875`, 줄간격 1.7이 적용된 것을 브라우저에서 확인했다.

## Plan 확정 (2026-11-10)
- 사용자가 추천안대로 진행하고 결과를 보며 하나씩 고치기로 했다. 자세한 내용은 `plan.md`의 "결정한 것"에 있다.
- 검증 항목에 `people`, `kidAges`, `goodFor` 검사를 더했다.
- Vercel 연결은 STEP 01 push 직후로 앞당겼다.
- 콘텐츠 커밋은 `chore(content):`를 쓴다.
- 사진은 C안(저장소 밖 원본 → 사본 + `prebuild` EXIF 검사)으로 한다. 이에 맞춰 스킬의 "사진 위치정보 제거 스크립트" 문장을 고쳤다.

## 프로젝트 이름과 컨셉 (2026-11-10)
- 사이트 이름은 "주말어디가"에서 "너어디가"로 바꿨다. 영문 이름(패키지, 저장소)은 `neo-eodiga`다.
- 아이 동반 가족 여행 사이트가 아니라 혼자, 커플, 친구, 가족 누구나 쓰는 사이트다. 특정 동행 유형을 기본값으로 가정하지 않는다.
- 지역은 부산·울산·경남 한정에서 전국으로 넓혔고 시도와 시군구 두 단계로 나눈다.
- 후기 frontmatter는 `adults`, `kids` 대신 `companion`과 `people`을 쓴다. `kidAges`는 `companion: 아이와`일 때만 쓴다.
- 장소에 `goodFor`(추천 동행)를 추가했다. 유모차, 수유실은 값이 있을 때만 보여준다.

## 시작 상태 (2026-11-10)
- 프로젝트 폴더 `D:\01-STUDY\dev\pro`는 비어 있었고 git 저장소도 아니었다.
- 이전 스킬 `.claude/skills/jumal-eodiga-dev` 폴더는 없어서 지울 것이 없었다.
- 이전 Plan, checklist, context-notes도 폴더에 없어서 새 스킬 기준으로 처음부터 작성했다.
- 새 스킬은 `C:\Users\GRS\Downloads\neo-eodiga-kit.zip`에서 `.claude/skills/neo-eodiga-dev`로 옮겼다. 압축 안의 `PROMPT.md`는 이번 요청문과 같아서 옮기지 않았다.
- STEP 02, 10, 12의 범위는 이전 Plan이 없어 스킬의 1단계 범위를 보고 새로 나눴다.

## 개발 환경 (2026-11-10 확인)
- Windows 10, Node 24.20.0, npm 11.19.0, git 2.55.0
- npm 기준 최신 `next`, `create-next-app`은 16.4.6이다.

## 스킬
- frontend-design 스킬은 `claude-plugins-official` 마켓플레이스에 있지만 설치되어 있지 않다. 설치 전까지는 마켓플레이스 폴더의 `SKILL.md`를 직접 읽고 그 원칙을 따른다.
- 스킬의 디자인 규칙(색, 서체, 형태, 피할 것)은 이미 정해진 결정이므로 frontend-design 원칙보다 우선한다.

## 지역 데이터 출처 (STEP 03, 2026-11-10 조사)
- 자료 이름은 "국토교통부_법정동코드_20260929"(공공데이터포털 파일데이터 15123287)이다.
  - 제공기관 국토교통부, 수정일 2026-09-29, CSV(CP949), 이용허락범위 제한 없음, 연간 갱신(차기 2027-09-29).
  - 설명에 따르면 행정안전부 행정표준코드관리시스템의 법정동코드 목록으로 만든 자료다.
  - 페이지는 https://www.data.go.kr/data/15123287/fileData.do 이다. 2026-11-10에 내려받았고 보안문자 요구는 없었다.
- 내려받은 파일은 53,387행이고 열은 `법정동코드`, `법정동명`, `폐지여부`다. `존재` 20,560행, `폐지` 32,827행이다.
- 법정동코드 10자리 중 앞 5자리가 시군구 코드다. 시군구 단위 행은 뒤 5자리가 `00000`이다.
- 같은 이름의 다른 자료 "국토교통부_전국 법정동_20260630"(15063424)도 있으나, 기준일이 더 이르고 원천이 국가공간정보통합플랫폼이라 쓰지 않는다.
- 자료에서 확인한, 스킬 작성 이후의 행정구역 변화가 있다.
  - 광주광역시(29)와 전라남도(46)가 `폐지`이고, `전남광주통합특별시`(12)가 새로 있다. 옛 광주 5개 구와 전남 22개 시군이 모두 12 아래로 옮겨졌다. 원천 사이트(행정표준코드관리시스템) 시도 선택 목록에도 `전남광주통합특별시`가 있다.
  - 그래서 `존재`인 시도 행은 15개이고, 세종은 시도 행 없이 시군구 단위 행 `36110 세종특별자치시` 하나만 있다.
  - 인천은 중구, 동구, 서구가 `폐지`이고 제물포구(28125), 영종구(28155), 서해구(28275), 검단구(28290)가 있다.
  - 일반구는 3단어 이름(예: `경기도 수원시 장안구`)으로 39개 있다. 부천시 일반구 3개, 화성시 일반구 4개가 들어 있다.
  - 제주는 행정시인 제주시(50110), 서귀포시(50130)가 시군구 단위 행으로 있다.
  - 이름 끝에 공백이 붙은 행이 있다(예: `경기도 부천시 원미구 `). 변환할 때 앞뒤 공백을 지운다.
- 변환 방법 (2026-11-10 사용자 확정)
  - `npm run build-regions -- <CSV 경로>`(`scripts/build-regions.ts`)로 `content/regions.json`을 만든다.
  - `존재`인 시군구 단위 행만 쓴다. 이름이 3단어인 일반구 39개는 빼고, 상위 시가 목록에 있는지만 확인한다.
  - 시도 짧은 이름은 스크립트의 `SIDO_SHORT` 표를 따른다. `전남광주통합특별시`의 짧은 이름은 사용자가 정한 "전남광주"다. 표에 없는 시도가 나오면 스크립트가 멈춘다.
  - 세종은 시도 "세종", 시군구 "세종시", 코드 `36110`이다. 제주 행정시(제주시, 서귀포시)는 넣는다.
  - 결과는 시도 16개, 시군구 230개다(2026-11-10 변환). 코드 순서로 정렬한다.
  - 원본 CSV(2.4MB, 대부분 동·리 행)는 저장소에 넣지 않는다. 다시 만들 때는 위 공공데이터포털 주소에서 내려받는다.
- 스킬의 "시도는 17개" 문장을 16개 기준으로 고쳤고, 세종과 제주 처리 규칙을 더했다.

## MDX 라이브러리 후보 조사 (2026-11-10)
- `@next/mdx` 16.4.6은 Next.js와 같은 버전으로 함께 배포된다. 내장 문서상 frontmatter는 기본 지원하지 않아 `remark-frontmatter` 같은 플러그인이 필요하고, Turbopack에서는 플러그인을 문자열 이름으로만 넘길 수 있다.
- `next-mdx-remote` 6.0.0은 GitHub 저장소가 보관(archived) 상태라 제외한다.
- `next-mdx-remote-client` 2.1.12는 유지되고 있고(최근 push 2026-08-18) React 19.1 이상을 요구한다. 현재 React 19.3.0과 맞는다.
- frontmatter 파싱 후보 `gray-matter` 4.0.3, 검증 후보 `zod` 4.6.7.
- **결정(사용자 확정)**: `@next/mdx` 16.4.6(정확한 버전 고정) + `remark-frontmatter`로 본문을 처리한다. Next.js와 같은 버전으로 함께 배포되어 업그레이드 때 호환이 가장 안전하기 때문이다. frontmatter 값은 `gray-matter`로 읽고 `zod`로 검사한다.
- `next.config.ts`에서 `remarkPlugins: ["remark-frontmatter"]`처럼 문자열로 넘긴다(Turbopack 제약). MDX 파일은 페이지가 아니라 import로만 쓰므로 `pageExtensions`는 바꾸지 않았다.
- `src/mdx-components.tsx`는 App Router에서 필수라 빈 목록으로 만들었다.
- 임시 MDX로 확인했다. frontmatter는 본문에 나오지 않고 `#`, `**`가 `<h1>`, `<strong>`으로 바뀌었다.

## STEP 11 구현 (2026-11-10)
- `sharp` 0.35.5(Next.js가 쓰는 것과 같은 버전)를 개발 의존성으로 고정했다. 설치된 sharp는 HEIF 계열 중 `.avif`만 읽고 HEIC는 읽지 못한다.
- **사진 넣는 법**: 원본을 저장소 밖 `<PHOTO_SOURCE_DIR>/<slug>/`에 두고 `npm run strip-exif -- <slug>`를 실행한다. `.env.local`에 `PHOTO_SOURCE_DIR=D:\neo-eodiga-photos`처럼 적는다(Node 24 `--env-file-if-exists`로 읽는다). 사본은 `public/images/reviews/<slug>/`에 생긴다.
- 사본은 회전 정보를 화소에 반영(`rotate()`)하고, 긴 변 1600px 안으로 줄이고(작은 사진은 키우지 않음), 흰 바탕 JPEG 품질 82로 저장한다. 출력에는 EXIF, XMP, IPTC가 없다. 만든 뒤 다시 읽어 확인한다.
- 사본 이름은 원래 이름을 소문자로, 밑줄을 하이픈으로 바꾸고 `.jpg`를 붙인다. 영문 소문자·숫자·하이픈이 아닌 이름(예: 한글)이나 겹치는 이름이면 멈춘다. HEIC가 있으면 JPG로 바꾸라는 안내와 함께 멈춘다.
- **빌드 전 검사** `npm run check-photos`가 `public/images` 아래 사진의 EXIF, XMP, IPTC를 확인한다. `prebuild`는 콘텐츠 검사 다음에 이 검사를 돌린다.
- **커밋 전 검사(D안)** `.githooks/pre-commit`이 같은 검사를 돌린다. `npm install`의 `prepare`(`scripts/setup-git-hooks.ts`)가 `git config core.hooksPath .githooks`를 설정한다. git 저장소가 아니면(예: Vercel 빌드) 건너뛴다. 이 검사는 작업 폴더 전체를 보므로, 위치정보가 남은 사진이 폴더에 있으면 다른 파일의 커밋도 막힌다.
- 확인한 것. GPS와 회전 정보(orientation 6)를 넣은 400×200 시험 JPG는 200×400 사본이 되고 메타데이터가 없다. 3000×2000 반투명 PNG는 1600×1067 JPEG가 된다. 원본을 `public/images`에 넣으면 `npm run build`가 `exit 1`, 그 원본만 커밋하려 하면 커밋이 막힌다(HEAD 그대로). 가짜 HEIC는 안내와 함께 멈춘다. 시험 파일은 모두 지웠다.

## STEP 10 구현 (2026-11-10)
- `SITE_URL`(https://neo-eodiga.vercel.app)을 `site.ts`에 두고 `metadataBase`로 쓴다. 페이지 메타데이터는 `pageMetadata()`(src/lib/metadata.ts)로 같은 모양을 만든다. 제목, 설명, canonical, openGraph(사이트 이름, ko_KR, 제목, 설명, 주소, 이미지)다. 공유 카드는 `summary_large_image`다.
- 페이지에서 `openGraph`를 정하면 레이아웃의 openGraph를 통째로 대신해서 공통 공유 이미지가 빠졌다(목록, 공지, 안내 페이지에 og:image 없음). 그래서 `pageMetadata()`가 기본으로 공통 이미지를 넣는다. 이렇게 하니 후기 상세도 같은 폴더의 `opengraph-image` 파일 대신 공통 이미지를 썼다. 코드에서 정한 images가 파일보다 우선했기 때문이다. 그래서 후기 상세는 자기 이미지 주소를 직접 넘긴다.
- 후기 상세 설명은 `describeReview()`로 만든다. 예: "부산 수영구, 2026년 11월 8일, 아이와 4명이 다녀온 여행 기록이에요."
- 공유 이미지는 `next/og`의 `ImageResponse`(1200×630 PNG)다. 한글 글꼴은 Google Fonts css2 API의 `text=` 부분 글꼴(TTF)을 받는다(800, 500 두 굵기). 받은 파일은 수십 KB다.
- Cache Components에서는 네트워크 요청이 있으면 이미지를 미리 만들지 못해 처음에 요청 때 그리기(ƒ)였다. 글꼴 받는 함수에 `"use cache"`와 `cacheLife("max")`를 붙여 빌드 때 만들도록 바꿨다(공통 ○, 후기 ●). 내장 문서 `15-route-handlers.md`의 Cache Components 절을 따랐다.
- 이미지 안에서는 CSS 토큰을 쓸 수 없어 `og.tsx`에만 globals.css와 같은 색 값을 적었다.
- 한글 제목이 글자 단위로 끊겨서("나/들이") `wordBreak: keep-all`을 넣었다.
- sitemap은 메인, 세 목록, 모든 상세 주소다. 후기 date는 다녀온 날이라 lastModified를 넣지 않았다. robots는 전체 허용과 sitemap 주소다.
- 확인한 것. 페이지별 title, description, canonical(후기 목록은 쿼리가 있어도 /reviews), og 태그, 공유 이미지 두 장의 한글 표시, robots.txt, sitemap.xml 9개 주소.
- 빌드 때 Google Fonts에 접속해야 한다. 인터넷이 없으면 공유 이미지를 만드는 단계에서 빌드가 실패한다.

## STEP 09 구현 (2026-11-10)
- 메인은 시안 순서대로 히어로, 공지사항(최신 4개) + 처음 오셨나요?, 최근 여행후기(태그 칩 + 최근 3개)다. 빌드 때 정적 페이지다.
- 히어로 제목은 "이번 주말, 어디 갈까?", 설명은 "전국 곳곳을 직접 다녀온 여행 기록이에요. 지역과 함께 가는 사람, 태그로 나에게 맞는 후기를 찾아보세요."다. 버튼은 여행후기 보기(주 색), 이용 안내(테두리)다. 시안의 지역 배지, 추천 검색 폼, 이번 주말 축제, 여행지도 안내 띠는 넣지 않았다.
- 최근 후기 위 태그 칩은 `/reviews?tag=` 링크다.
- 공지 줄과 이용 안내 바로가기를 메인에서도 쓰려고 `NoticeList`, `GuideLinks` 컴포넌트로 뺐고, STEP 08의 공지 목록, 이용 안내 목록·상세도 이 컴포넌트를 쓰게 바꿨다(`refactor:` 커밋).
- 확인한 것. 375px 가로 스크롤 없음, 터치 영역 44px 이상, 1280px에서 공지와 처음 오셨나요?가 옆으로 놓임, 예전 시안 문구("주말어디가", "아이랑", "부산 · 울산") 없음, 공지·안내 페이지가 바뀐 뒤에도 정상.

## STEP 08 구현 (2026-11-10)
- 공지 목록 `/notices`(최신순 제목·날짜 줄), 공지 상세 `/notices/<slug>`, 이용 안내 목록 `/guide`("처음 오셨나요?" 모양), 이용 안내 상세 `/guide/<slug>`(아래에 다른 안내 링크)를 만들었다. 시안 메인 화면의 공지 목록과 바로가기 모양을 따랐다.
- 이용 안내 3개(how-to-use, review-tips, photo-tips)는 `guide-content.md`를 소제목과 목록으로 나눠 썼고 뜻은 바꾸지 않았다. "정보가 바뀌었다면 알려주세요" 문장은 연락 방법이 없어 뺐다. 사진 개인정보 안내는 photo-tips 마지막 "사진 올릴 때 꼭 지켜주세요"다.
- 이용 안내 frontmatter에 `order`(1 이상 정수, 필수)를 더했고 같은 order가 있으면 빌드가 실패한다. `loadContent()`가 공지는 최신순, 이용 안내는 order 순으로 돌려준다.
- 현재 위치 표시를 `Breadcrumb` 컴포넌트로 만들어 새 페이지에서 쓴다. 후기 상세의 같은 표시는 이번에 바꾸지 않았다.
- 없는 공지·안내 주소는 로컬 `next start`에서도 HTTP 404였다. `outputFileTracingIncludes`에 `/notices/*`, `/guide/*`를 더했다.
- 정상 페이지 HTML에도 404 문구가 들어 있으나, 화면에는 보이지 않는다(브라우저에서 확인). Next가 클라이언트 이동용으로 404 화면 데이터를 함께 보내기 때문이다.
- 확인한 것. 375px 가로 스크롤 없음, 터치 영역 44px 이상, 헤더 현재 메뉴(공지사항, 이용 안내), 1280px 이용 안내 목록, 안내 순서, 사진 개인정보 문구.

## STEP 07 구현 (2026-11-10, 키 없이 먼저)
- 사용자가 카카오맵 키 없이 먼저 진행하라고 했다. 키와 좌표가 들어오면 지도가 나오도록 만들고, 지금은 목록만 보인다.
- 카카오맵 API는 공식 문서(https://apis.map.kakao.com/web/documentation/)를 내장 브라우저로 열어 확인했다. 문서 본문은 자바스크립트로 그려져서 단순 내려받기로는 목차만 보였다. 확인한 것은 `autoload=false` + `kakao.maps.load(callback)`, `Map(container, { center, level, scrollwheel })`, `LatLngBounds().extend()`, `setBounds(bounds[, top, right, bottom, left])`(기본 여백 32), `CustomOverlay`의 `content`는 Node 또는 HTML 문자열, `Polyline`의 `strokeColor`는 `#xxxxxx`, `strokeStyle` 11종(`shortdash` 등)이다.
- `RouteMap`(서버)이 키(`NEXT_PUBLIC_KAKAO_MAP_KEY`)와 좌표가 있는 장소를 확인하고, 있으면 `KakaoRouteMap`(클라이언트)을 목록 위에 그린다. 동선 칸과 MDX의 `<RouteMap />`이 같은 컴포넌트를 쓴다.
- 선 색은 CSS 토큰 `--color-primary`를 읽어 쓴다. 번호 원은 주 색 바탕, 흰 글자, 흰 테두리(시안)다.
- 키는 빌드 때 페이지에 들어간다(정적 페이지). Vercel에 키를 넣은 뒤에는 다시 배포해야 지도가 나온다.
- 확인한 것. 키가 없으면 지도 상자와 SDK 요청이 없고 목록만 나온다. 가짜 키와 임시 좌표로 빌드하면 카카오가 SDK 요청에 401(`AccessDeniedError`, "wrong appKey format")로 응답하고, 지도 상자가 사라지며 목록만 남는다. 임시 좌표는 되돌렸다.
- 실제 지도 표시(번호, 점선, 범위 맞춤)는 사용자가 키와 도메인을 등록하고 좌표를 준 뒤 확인한다.

## STEP 06 구현 (2026-11-10)
- `/reviews/<slug>`는 `generateStaticParams`로 빌드 때 정적 페이지가 된다(광안리 후기 ○). MDX 본문은 `@content/*` 경로 별칭(tsconfig)으로 import한다.
- `cacheComponents`에서는 `dynamicParams`를 쓸 수 없다(내장 문서 `dynamicParams.md`). 그래서 없는 slug는 요청 때 페이지가 `notFound()`를 부르고, 이 경로도 `outputFileTracingIncludes`에 content를 넣었다.
- 없는 slug는 로컬 `next start`에서 404 화면에 HTTP 200이다. Vercel 운영 주소에서는 HTTP 404로 응답했다(2026-11-10 확인). Cache Components는 미리 만든 껍데기를 먼저 보내서 응답이 200으로 시작하기 때문이다(내장 문서 `loading.md`의 Status codes). 대신 Next가 `<meta name="robots" content="noindex">`를 넣어 검색에 나오지 않는다(확인함). 진짜 404 상태가 필요하면 Proxy에서 slug를 검사하는 방법이 있다. 지금은 쓰지 않는다.
- 후기가 0개가 되면 `generateStaticParams`가 빈 배열이라 빌드가 실패한다(내장 문서 `generate-static-params.md`). 후기를 모두 지울 일이 생기면 다시 본다.
- 동선, 장소 카드, 비용은 시안 자리에 frontmatter로 그린다. `<PlaceCard id />`, `<RouteMap />`, `<CostSummary />`는 본문에서도 쓸 수 있다. 본문의 `PlaceCard` id가 없으면 빌드가 실패한다. `RouteMap`은 STEP 07 전까지 방문 순서 목록만 그린다.
- 같은 장소 카드나 비용 상자가 옆 칸과 본문에 함께 나오면 제목 `id`가 겹쳐서, 영역 이름을 `aria-label`로 바꿨다.
- 확인한 것. 375px 위아래 배치, 1280px 2단, 가로 스크롤 없음, 터치 영역 44px 이상, 정보 없음 4칸, 직접 가봄, 비용 없음 문구, 지역 링크, 목록 카드에서 상세로 이동, 중복 id 없음.
- 값이 있을 때만 나오는 항목은 임시 값으로 확인하고 되돌렸다. 추천 동행, 유모차, 수유실, 아이 나이, 비용 합계(0원 + 32,000원 + 5,600원 = 37,600원), 본문 안 컴포넌트가 나왔다.

## STEP 05 구현 (2026-11-10)
- 헤더와 푸터를 시안에 맞췄다. 해 아이콘 28px, 이름 22px, 메뉴 15px, 현재 메뉴는 강조 바탕 + 링크색 + 700이다. 내용 폭은 `max-w-page`(1200px, `--container-page`)이다. 푸터는 로고 없이 한 줄 소개, 저작권, 메뉴 링크다.
- `/reviews`는 Partial Prerender다. 제목과 설명은 미리 만들고, 필터와 결과는 `Suspense` 안에서 `searchParams`를 읽어 요청 때 그린다(내장 문서 `08-caching.md`의 "Maximizing the static shell").
- 요청 때 `content` 폴더를 읽으므로 `next.config.ts`의 `outputFileTracingIncludes`에 `/reviews`를 넣었다. 빌드 결과 `page.js.nft.json`에 content 파일 4개가 들어간 것을 확인했다.
- 지역 선택칸은 `next/form`의 GET 폼이다. 선택칸을 바꾸면 바로 제출하고(클라이언트 컴포넌트 `AutoSubmitSelect`), 자바스크립트가 없으면 `noscript` 안의 적용 버튼으로 제출한다. 시도를 바꾸면 시군구 칸을 비우고, 빈 칸은 주소에 남기지 않는다.
- 누구와, 태그 칩은 링크다(`scroll={false}`). 고른 칩을 다시 누르면 조건이 풀린다. 고른 칩에는 `aria-current="true"`를 단다.
- 쿼리 값이 선택지에 없으면 무시한다(예: 후기가 없는 "서울", "부산 중구", "연인").
- 태그 필터 목록은 `FILTER_TAGS`(content.ts)다. 후기 태그 자체는 제한하지 않는다.
- 결과 없음 문구는 처음에 "고른 조건은 {조건}이에요"였으나 "부산 수영구이에요"처럼 조사가 틀려서, 고른 조건을 칩으로 보여주게 바꿨다.
- 확인한 것. 375px에서 가로 스크롤 없음, 터치 영역 44px 이상. 시도 선택 → `?sido=부산`, 시군구 칸에 "수영구 (1)". 시군구 선택 → `?sido=부산&sigungu=수영구`. 커플 칩 → 결과 없음 화면. 시도를 전체로 → `?companion=커플`(시군구 지워짐).
- 확인 중 알게 된 것. 내장 브라우저 창이 가려져 있으면 React 19의 스트리밍 교체가 다음 화면 그리기(requestAnimationFrame)를 기다리느라 대체 문구에 멈춰 있었다. 스크린샷으로 화면을 한 번 그리면 바로 교체되고 동작했다. 실제 사용자 화면에서는 생기지 않는 확인 환경의 현상이다.

## 화면 시안 검토 (2026-11-10)
- 사용자가 시안(https://claude.ai/artifact/FjP3uvcYqpA7H1Ca1v3McW)대로 진행하겠다고 했다. Design 캔버스이고 화면은 7개다. 메뉴 구성도, 메인 화면, 여행후기 상세, 여행추천, 지역별 축제, 나의 여행지도, 관리자 대시보드다.
- 시안은 이름·컨셉 변경 전에 만들어졌다. 캔버스 제목이 "주말어디가 메뉴와 화면 구성"이다.
- **시안 그대로 따를 것 (1단계 범위 안)**
  - 헤더는 해 아이콘 28px + 이름 22px/800이다. 메뉴는 15px/500 글자에 안쪽 여백 12px 14px, 모서리 10px이다. 현재 메뉴는 밑줄이 아니라 강조 바탕(`#EAF4FF`)과 링크 글자색(`#1565C0`), 굵기 700이다.
  - 내용 폭은 최대 1200px, 좌우 여백은 24px이다.
  - 메인은 히어로 상자(강조 바탕, 모서리 28px)가 있다. 그 아래 공지 목록과 "처음 오셨나요?" 바로가기 3개가 옆으로 놓이고, 다음에 최근 여행후기(태그 칩 + 후기 카드)가 온다.
  - 후기 카드는 사진 자리 190px, 지역·태그 칩, 제목 19px/800, 작성자 배지와 인원이다.
  - 후기 상세는 현재 위치(홈 › 여행후기 › 지역), 태그 칩, 제목 38px, 작성자·다녀온 날·인원 줄이다. 왼쪽 본문(이날의 동선 지도 + 순서 목록, 후기, 사진)과 오른쪽 장소 카드·실제로 쓴 비용(합계)의 2단 구성이다.
  - 푸터는 옅은 바탕에 한 줄 소개와 링크다.
- **스킬을 따라 시안과 다르게 할 것**
  - 이름은 "주말어디가"가 아니라 "너어디가"다.
  - 히어로 문구 "이번 주말, 아이랑 어디 갈까?"와 "부산 · 울산 · 경남" 배지는 쓰지 않는다. 특정 동행과 지역을 전제하지 않는다.
  - 헤더의 여행추천, 지역별 축제, 나의 여행지도, 로그인은 넣지 않는다. 1단계 메뉴만 둔다.
  - 히어로의 추천 검색 폼(지역·기간·인원), 이번 주말 축제, 여행지도 안내 띠는 다음 단계 기능이라 만들지 않는다.
  - 후기 상세의 도움 됐어요, 이 장소 다녀왔어요, 공유하기, 댓글, 제보하기, 우리 인원으로 다시 계산은 다음 단계 기능이다.
  - 인원 표시는 "어른 1 · 아이 2"가 아니라 `companion`과 `people`(예: 아이와 4명)이다.
  - 장소 카드의 유모차, 수유실은 값이 있을 때만 보여준다. 시안은 항상 보여준다.
  - 푸터의 이용약관, 개인정보처리방침, 문의 페이지는 없으므로 넣지 않는다.
- **시안에만 있는 색**은 스킬 색 표에 없다. `#3A4754`(메뉴·칩 글자), `#CBD7E3`(입력칸·칩 테두리), `#F1F5F9`(칩 바탕), `#F7FAFD`(푸터 바탕), `#DCE5EE`·`#E6ECF2`·`#EDF1F5`(구분선), `#2E3A46`(본문 글자), `#DCEBFA`(사진 자리), `#0D47A1`(링크 마우스 오버)다. 
  - 결정(사용자 확정): `#3A4754`는 `ink-soft`, `#CBD7E3`는 `line-strong` 토큰으로 더하고 스킬 색 표에도 적었다. 나머지는 가까운 기존 토큰으로 맞춘다. `#F1F5F9`, `#F7FAFD`는 `surface-muted`, `#DCE5EE`, `#E6ECF2`, `#EDF1F5`는 `line`, `#2E3A46`는 `ink`, `#DCEBFA`는 `surface-accent`, 링크 마우스 오버는 색을 바꾸지 않는다.
- 공지 목록의 분류 배지(새 글, 안내, 공지)는 공지 frontmatter에 분류 필드가 없어 지금은 만들 수 없다.

## STEP 04 샘플 콘텐츠 (2026-11-10)
- 사용자가 준 사실로 광안리 후기와 장소를 만들었다. 부산 수영구, 2026-11-08(일요일), 아이와 4명(아이 2명), 대중교통, 19:00 도착 21:00까지 머묾.
- 19~21시는 장소 운영시간이 아니라 다녀온 시간이라고 사용자가 확인했다. 그래서 장소 `hours`는 비우고 후기 `route`의 `time`, `note`에 적었다.
- 사용자가 장소 분류로 "해수욕장"을 골라 `PLACE_CATEGORIES`와 스킬의 `Place.category`에 추가했다.
- 답이 없던 항목은 비워 두었다. 아이 나이, 무료 태그, 추천 동행(`goodFor`), 좌표, 비용, 주차, 예약이다.
- 본문은 받은 사실만으로 썼다(사용자 문장 없음). 제목 "대중교통으로 다녀온 광안리 저녁 나들이"도 사실만으로 지었다.
- MDX 컴포넌트(`RouteMap`, `PlaceCard`, `CostSummary`)는 아직 없어서 본문에 넣지 않았다. STEP 06, 07에서 넣는다.
- 공지 샘플("사이트를 열었어요", 2026-11-10)을 사용자 확인 뒤 넣었다. 본문은 `guide-content.md`의 사이트 소개 문장을 그대로 썼다.
- 다른 동행 유형의 후기 자료는 없다고 사용자가 답했다. 샘플 후기는 광안리 하나로 간다.

## STEP 03 검증 구현 (2026-11-10)
- `src/lib/content.ts`의 `loadContent()`가 지역, 장소, 후기, 공지, 이용 안내를 모두 읽어 검사하고, 문제를 모아 한 번에 오류로 던진다. 페이지(STEP 05~)도 이 함수를 쓴다.
- `scripts/check-content.ts`를 `prebuild`에서 실행한다. 로컬과 Vercel 모두 `npm run build` 직전에 돌아서, 아직 콘텐츠를 쓰는 페이지가 없어도 빌드가 멈춘다.
- 스크립트를 Node 24의 TypeScript 직접 실행으로 돌린다. 이를 위해 아래를 바꿨다.
  - `package.json`에 `"type": "module"`. 없으면 Node가 실행할 때마다 `MODULE_TYPELESS_PACKAGE_JSON` 경고를 낸다. 바꾼 뒤 lint, build가 그대로 통과했다.
  - `tsconfig.json`에 `"allowImportingTsExtensions": true`. 스크립트가 `../src/lib/content.ts`를 확장자까지 적어 import하기 때문이다. `noEmit`이 켜져 있어 쓸 수 있다.
  - 그래서 `content.ts`는 `@/` 경로 별칭이나 다른 로컬 파일을 import하지 않는다.
- frontmatter YAML은 `js-yaml` 4의 CORE 스키마로 읽는다. 기본 설정은 `time: 10:00`을 숫자 600으로, `2026-02-30`을 날짜 객체로 바꿔 `2026-03-02`가 되게 만들었다. 사실이 조용히 바뀌는 것을 막으려고 바꿨다.
- 요청 항목 외에 더한 검사(사용자 확정 3개 포함)
  - `people` 1 이상의 정수, `kidAges`는 `아이와`일 때만, 장소 `goodFor`는 정해진 다섯 값
  - 정해지지 않은 항목이 있으면 실패한다(예: 옛 필드 `adults`, `kids`, 오타)
  - 날짜는 YYYY-MM-DD이고 달력에 있는 날이어야 한다. `route.time`은 HH:MM이다.
  - 장소 id와 파일 이름은 영문 소문자, 숫자, 하이픈만 쓴다. 장소 id는 겹치면 안 된다.
  - 장소의 `lat`과 `lng`는 함께 쓰거나 함께 뺀다.
  - `cost`는 `admission`, `food`, `transport`만, 0 이상의 정수(원)다.
  - 공지는 `title`, `date`, 이용 안내는 `title`만 있다. STEP 08에서 필요하면 늘린다.
- 틀린 콘텐츠를 일부러 넣어 `npm run build`가 `exit 1`로 멈추는 것을 확인했다. 확인한 경우는 필수 필드 누락, `companion` 오류, `people` 0, `kidAges`와 `가족`, 옛 필드 `adults`, 지역 조합 오류("부산 해운대시", "전남 광산구"), 없는 장소 id, 장소 id 형식, `goodFor` 오류, `lat`만 있음, 장소 id 중복, 없는 날짜다. 확인 뒤 임시 파일은 지웠다.
- 스키마 검사에 실패한 항목은 지역·장소 연결 검사를 건너뛴다. 그래서 오류를 고친 뒤 다음 오류가 새로 보일 수 있다.

## 열린 질문
- 후기 `tags`를 필터의 다섯 값(실내, 야외, 무료, 비 오는 날, 대중교통)으로 제한할지 (지금은 제한하지 않음)
- 저장소는 공개다(2026-11-10 확인). 사진 커밋 전 검사(D안)는 STEP 11에서 넣기로 했다(해결).
- "혼자면 `people`은 1", "아이와면 `kidAges` 필수" 검사를 더할지
- 푸터 연락 방법(GitHub 이슈, 이메일 등)을 무엇으로 할지. 정해지면 이용 안내 "사이트 이용 방법"에 초안의 "정보가 바뀌었다면 알려주세요. 확인한 뒤 고쳐둘게요." 문장도 되살린다.
