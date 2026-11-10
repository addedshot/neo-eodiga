# 너어디가 1단계 체크리스트

STEP마다 마지막 세 항목(lint, build, 커밋)을 확인한 뒤 다음 STEP으로 넘어간다.

## 준비
- [x] 이전 스킬 `.claude/skills/jumal-eodiga-dev` 확인 (폴더 없음, 지울 것 없음)
- [x] 새 스킬 `.claude/skills/neo-eodiga-dev` 배치와 읽기
- [ ] frontend-design 스킬 설치 (마켓플레이스에는 있으나 설치 안 됨, 사용자가 설치)
- [x] Plan, checklist, context-notes 사용자 확인 (추천안으로 확정)
- [x] STEP 04 커밋 타입 결정 (`chore(content):`)
- [x] STEP 11 사진 처리 방식 결정 (C안, 스킬 문구 수정)

## STEP 01. 프로젝트 기본 설정
- [x] Next.js(App Router, TypeScript, `src`), Tailwind, ESLint, npm으로 생성
- [x] 패키지 이름 `neo-eodiga`
- [x] `AGENTS.md`가 있으면 `node_modules/next/dist/docs/` 확인
- [x] 테마 색을 Tailwind 테마 토큰으로 등록
- [x] Noto Sans KR(400·500·700·800), `lang="ko"`
- [x] `src/lib/site.ts`에 사이트 이름 상수
- [x] 루트 `CLAUDE.md` (`AGENTS.md`가 있으면 맨 위 `@AGENTS.md`)
- [x] `npm run lint` 통과
- [x] `npm run build` 통과
- [x] 커밋 (기본 설정 / 문서와 스킬)
- [x] 원격 저장소 연결과 push
- [x] Vercel 연결 (사용자가 직접, https://neo-eodiga.vercel.app)

## STEP 02. 공통 레이아웃
- [x] 디자인 계획 사용자 확인 (추천안)
- [x] 메뉴 목록 `NAV_ITEMS`, 로고 `SiteLogo`
- [x] 헤더 (1단계 메뉴만, 좁은 화면에서 줄바꿈)
- [x] 현재 메뉴 표시 (`aria-current`, `Suspense`)
- [x] 푸터
- [x] 404 페이지 (상태 코드 404)
- [x] 본문으로 건너뛰기, 키보드 초점 표시, 터치 영역 44px
- [x] 375px, 1280px 화면 확인
- [x] lint · build · 커밋
- [x] push 후 Vercel 배포 확인

## STEP 03. 콘텐츠 구조, 지역 데이터, 검증
- [x] MDX 라이브러리 선택과 이유 기록 (`@next/mdx`)
- [x] 공식 행정구역 코드 자료 확보 (국토교통부_법정동코드_20260929)
- [x] `content/regions.json` 생성 (시도 16개, 기초자치단체 단위, 시군구 5자리 코드, 세종시·제주 행정시 포함)
- [x] 일반구가 상위 시로 합쳐졌는지 확인
- [x] 자료 출처와 기준 날짜를 `context-notes.md`에 기록
- [x] 변환 스크립트 저장
- [x] 타입 정의 (`Region`, `Place`의 `goodFor`, 후기 frontmatter의 `companion`·`people`·`kidAges`)
- [x] 필수 필드 누락 시 빌드 실패
- [x] 잘못된 `companion` 값이면 빌드 실패
- [x] 후기·장소의 시도·시군구 조합이 `regions.json`에 없으면 빌드 실패
- [x] `route`의 장소 id가 `places.json`에 없으면 빌드 실패
- [x] `people`, `kidAges`, `goodFor`, 정해지지 않은 항목, 날짜, 장소 id 검사
- [x] MDX 설정 확인 (frontmatter가 본문에 나오지 않음)
- [x] 위 실패 경우를 일부러 만들어 실제로 실패하는지 확인 (build exit 1, 메시지 확인)
- [x] lint · build · 커밋

## STEP 04. 샘플 콘텐츠
- [x] 샘플 후기 (광안리, 아이와 1개. 다른 동행 유형 자료는 없음)
- [x] 샘플 공지 (사이트를 열었어요, 2026-11-10)
- [x] 샘플 장소 (광안리해수욕장, 분류 해수욕장 추가)
- [x] lint · build · 커밋 (`chore(content):`)

## STEP 05. 여행후기 목록과 필터
- [x] 시도 → 시군구 2단계 지역 선택
- [x] 후기 있는 지역만, 후기 수와 함께 표시
- [x] 누구와 필터
- [x] 태그 필터
- [x] URL 쿼리 `?sido=&sigungu=&companion=&tag=` 유지
- [x] 결과 없음 안내
- [x] lint · build · 커밋
- [x] 헤더·푸터 시안에 맞춤
- [x] push 후 Vercel에서 /reviews 확인 (필터 4가지 조합 정상)

## STEP 06. 여행후기 상세
- [x] 디자인 계획 사용자 확인 (추천안)
- [x] 다녀온 날, 누구와, 인원, 교통수단
- [x] 아이 나이는 아이와일 때만
- [x] 본문 MDX
- [x] `PlaceCard` (기본 항목 "정보 없음", 추천 동행·유모차·수유실은 값 있을 때만)
- [x] `CostSummary`
- [x] lint · build · 커밋
- [ ] push 후 Vercel에서 확인

## STEP 07. 동선 지도
- [ ] `RouteMap` 카카오맵
- [ ] 지도 중심과 확대를 장소 좌표 범위에 맞춤 (고정 지역 없음)
- [ ] 키나 좌표가 없으면 방문 순서 목록만
- [ ] `.env.example` (`.gitignore`에 `!.env.example` 추가)
- [ ] lint · build · 커밋

## STEP 08. 공지사항과 이용 안내
- [ ] 공지사항 목록과 상세
- [ ] 이용 안내 3개 (새 `guide-content.md` 기준)
- [ ] 사진 개인정보 안내 (다른 사람 얼굴 전체, 아이 얼굴 특히 주의)
- [ ] lint · build · 커밋

## STEP 09. 메인
- [ ] 히어로 (특정 동행·지역을 전제하지 않는 문구)
- [ ] 공지 최근 4개
- [ ] "처음 오셨나요?" 바로가기 3개
- [ ] 최근 여행후기 카드
- [ ] lint · build · 커밋

## STEP 10. 검색 노출
- [ ] 페이지별 메타데이터
- [ ] `sitemap`, `robots`
- [ ] 공유 미리보기 이미지
- [ ] lint · build · 커밋

## STEP 11. 사진 위치정보 제거
- [ ] `npm run strip-exif -- <slug>` (원본 폴더 → 위치정보 지운 사본)
- [ ] 회전 정보 반영 확인
- [ ] `prebuild` EXIF 검사로 빌드 실패 확인
- [ ] lint · build · 커밋

## STEP 12. 최종 확인
- [ ] Vercel 배포 화면에서 전체 페이지 확인
