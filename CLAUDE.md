@AGENTS.md

# 너어디가 (neo-eodiga)

작업을 시작하기 전에 아래 문서를 순서대로 먼저 읽는다.

1. `.claude/skills/neo-eodiga-dev/SKILL.md` 작업 절차, 기술 스택, 1단계 범위, 콘텐츠 구조, 디자인 규칙
2. `.claude/skills/neo-eodiga-dev/references/guide-content.md` 이용 안내 내용 초안
3. `plan.md` STEP별 계획과 결정한 것
4. `checklist.md` 진행 상태
5. `context-notes.md` 결정 이유, 자료 출처, 열린 질문
6. `docs/sitemap.md` 확정한 메뉴 구성(여행추천 중심, 로그인 없는 개인 사이트)

문서끼리 내용이 다르면 스킬을 따르고, 다른 점은 `context-notes.md`에 적는다.
UI를 만들거나 바꿀 때는 frontend-design 스킬도 함께 쓴다.

## 언어
- 진행 과정, 질문, 결과 보고는 모두 한국어로만 쓴다. 도구를 실행하기 전후의 짧은 안내 문장도 한국어로 쓴다.
- 코드 식별자, 명령어, 커밋 타입 접두어(`feat:` 등)는 그대로 둔다.
- `.claude/settings.json`의 `language: korean` 설정과 `UserPromptSubmit` 훅이 메시지마다 이 규칙을 다시 알려준다.

## 화면 시안
- 시안은 https://claude.ai/artifact/FjP3uvcYqpA7H1Ca1v3McW 에 있는 Design 캔버스다. Artifact 도구의 `read`로 `project/*.dc.html` 파일을 읽을 수 있다.
- 1단계에서 참고하는 화면은 메인 화면(`Home.dc.html`), 여행후기 상세(`Review.dc.html`)와 두 화면의 공통 헤더, 푸터다. 여행추천, 지역별 축제, 나의 여행지도, 관리자 대시보드는 다음 단계 화면이다.
- 시안은 이름 변경과 컨셉 변경 전("주말어디가", 아이 동반, 부산·울산·경남)에 만들어졌다. 이름, 컨셉, 1단계 범위, 문구가 다르면 스킬을 따르고, 배치와 모양은 시안을 따른다. 시안과 다르게 만든 부분은 `context-notes.md`의 "화면 시안 검토"에 적는다.
