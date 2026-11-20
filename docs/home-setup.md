# 집 PC에서 이어 하기

2026-11-20 학원 PC 작업을 마치고 집 PC로 옮기며 정리한 안내다. 학원 PC와 GitHub는 같은 상태로 맞춰 두었다(마지막 커밋 기준).

## 1. 한 번만 설치
- Git: https://git-scm.com
- Node.js 24(학원 PC는 24.20). 스크립트가 `.ts` 파일을 바로 실행하므로 24 버전이 필요하다.
- Claude 데스크톱 앱(Code 탭). 같은 Claude 계정으로 로그인한다.

## 2. 프로젝트 받기
```bash
git clone https://github.com/addedshot/neo-eodiga.git
cd neo-eodiga
npm ci
```
- `npm ci`가 패키지 설치와 사진 커밋 전 검사(`.githooks`) 설정을 함께 한다.
- 처음 push할 때 GitHub 로그인 창이 뜨면 저장소 주인 계정으로 로그인한다.

## 3. API 키(git에 없음)
`.env.example`을 복사해 `.env.local`을 만들고 값을 채운다. 키는 채팅, 메일, 메신저로 옮기지 않는다.

| 이름 | 어디서 | 쓰는 곳 |
|---|---|---|
| `TOUR_API_KEY` | 공공데이터포털 → 마이페이지 → 인증키 → 일반 인증키(Decoding) | 축제·명소·먹을 곳·숙소 자료, 관광지 집중률, 모범음식점 |
| `FOOD_SAFETY_API_KEY` | 식품안전나라 → 마이페이지 → 인증키 신청현황 | 위생등급 지정 표시(없으면 지난 색인을 그대로 씀) |
| `NEXT_PUBLIC_KAKAO_MAP_KEY` | 카카오 개발자 → 내 애플리케이션 → 앱 키 → JavaScript 키 | 지도(아직 발급 전) |

GitHub 저장소 Settings → Secrets and variables → Actions에는 `TOUR_API_KEY`가 있다. `FOOD_SAFETY_API_KEY`는 아직 등록하지 않았다(등록하면 매주 자동 갱신 때 위생등급도 새로 받는다).

## 4. 확인
```bash
npm run build
npm run dev
```
`http://localhost:3000`이 열리면 준비가 끝났다. 운영 주소는 https://neo-eodiga.vercel.app 이고 GitHub main에 push하면 Vercel이 자동으로 배포한다.

## 5. Claude Code로 이어 가기
새 대화의 첫 메시지로 아래처럼 쓴다. 지난 대화 내용은 넘어오지 않지만 결정과 진행 상황은 저장소 문서에 모두 있다.
> checklist.md와 context-notes.md를 읽고 여행추천 개선 작업을 이어서 해줘

한국어로만 답하는 규칙은 `CLAUDE.md`와 `.claude/settings.json`(language, UserPromptSubmit 훅)에 있어 그대로 적용된다.

## 6. 날마다 지킬 것
- 시작 전에 `git pull`(매주 월요일 03:00 자동 갱신도 GitHub에 커밋을 올린다).
- 끝나면 커밋하고 push.

## 7. 다음 할 일(2026-11-20 기준, 자세한 것은 `checklist.md`의 "여행추천 개선")
1. 먹을 곳 자료 받기(관광공사 하루 한도가 있어 나눠서):
   ```bash
   npm run build-festivals
   npm run build-attractions -- --sido 부산,울산,경남 --max-calls 500
   npm run build-food-details -- --max-calls 500
   npm run build-badges
   npm run build-attractions -- --sido 부산,울산,경남 --max-calls 0
   npm run build-festivals
   ```
   명소 먹을 곳은 관광공사 id를 담는 판(v3)으로 다시 받아야 한다. 2026-11-16에 정규식 오류로 id 없이 받은 곳이 있다.
2. 나2 가고 싶은 곳 직접 정하기와 단계 바꾸기
3. 나6 명소 상세 페이지 `/attractions/[id]`, 단계 사이 거리, 가는 길에 들를 곳
4. 나3 출발·도착 날짜와 시간(선택)으로 여러 날 계획과 숙소
5. 카카오 키를 받으면 이동 시간(카카오모빌리티 자동차 길찾기, 하루 10,000건 무료)과 지도
6. 나머지 시도 명소 채우기(`npm run build-attractions -- --sido <시도>`, 시도마다 하루 이틀)

## 자주 쓰는 명령
| 명령 | 하는 일 |
|---|---|
| `npm run build-festivals` | 지역축제 받기(주 1회 자동) |
| `npm run summarize-festivals` | 축제 짧은 소개(로컬 Claude Code, `claude -p`) |
| `npm run build-attractions -- --sido 부산,울산,경남` | 대표 명소, 상세, 근처 먹을 곳·주차장 |
| `npm run build-food-details` | 먹을 곳 메뉴·영업 정보·인허가번호 |
| `npm run build-badges` | 모범음식점·백년가게·위생등급·호텔 등급 색인 |
| `npm run build-reference` | 100대 명산·세계유산·사적·명승 |
| `npm run build-region-centers` | 시군구 대표 좌표 |
| `npm run check-content` | 콘텐츠 검사(빌드 전에 자동) |
