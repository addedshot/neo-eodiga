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

## 지역 데이터 출처 (STEP 03에서 채움)
- 자료 이름
- 내려받은 곳(URL)
- 기준 날짜
- 변환 방법(일반구를 상위 시로 합친 규칙, 시도 짧은 이름 대응표)
- 확인할 점. 2023년 이후 이름이 바뀌거나 개편된 시도·시군구가 자료에 반영되었는지 본다(예: 강원특별자치도, 전북특별자치도, 인천 자치구 개편). 실제 목록은 자료만 따른다.

## 열린 질문
- MDX 처리 라이브러리 (STEP 03에서 Next.js 16 호환성을 확인해 정함)
- 저장소가 공개로 확인되었다(2026-11-10, GitHub API 비로그인 조회 200). 사진 커밋 전 훅(D안)을 STEP 11에서 더할지 정한다.
- "혼자면 `people`은 1", "아이와면 `kidAges` 필수" 검사를 더할지
