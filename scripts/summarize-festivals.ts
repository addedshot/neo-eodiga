// 축제 소개 글을 짧은 요약(한 줄 소개, 볼거리·할거리, 알아둘 점)으로 만들어 content/festival-summaries.json에 저장하는 스크립트
// 운영자 PC에서 Claude Code(`claude -p`)로 실행한다. API 키나 별도 결제가 필요 없고 Claude 구독 사용량을 쓴다.
// 사용법: npm run summarize-festivals            (요약이 없거나 원문이 바뀐 축제만 요약한다)
//         npm run summarize-festivals -- --all    (모든 축제를 다시 요약한다)
// 요약에 원문에 없는 숫자가 있거나 형식이 맞지 않으면 그 요약은 버린다. 화면은 요약이 없으면 원문 앞부분을 보여준다.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { festivalSourceHash, todayInKorea } from "../src/lib/festivals.ts";

const FESTIVALS = path.join(process.cwd(), "content", "festivals.json");
const OUTPUT = path.join(process.cwd(), "content", "festival-summaries.json");
const BATCH_SIZE = 8;
const LIMITS = { oneLine: 70, highlight: 50, note: 70 };

type SourceFestival = { id: string; name: string; overview?: string; program?: string; subEvent?: string };
type Summary = { sourceHash: string; oneLine: string; highlights: string[]; notes: string[]; summarizedOn: string };

const SYSTEM_PROMPT = [
  "너는 국내 축제 소개 글을 방문자가 10초 안에 읽을 수 있게 줄이는 편집자다.",
  "입력은 축제 JSON 배열이다(id, name, overview 소개, program 프로그램, subEvent 부대행사).",
  "규칙:",
  `- oneLine: 이 축제가 무엇인지 한 문장(${LIMITS.oneLine}자 이내). 연혁, 수상, 개최 횟수 같은 내용은 빼고 무엇을 하는 행사인지 쓴다.`,
  `- highlights: 가서 보거나 할 수 있는 것 1~3개(각 ${LIMITS.highlight}자 이내, 명사형으로 끝낸다).`,
  `- notes: 방문자가 알아야 할 주의사항 0~2개(각 ${LIMITS.note}자 이내). 우천 시 변경, 준비물, 입장 제한처럼 원문에 적힌 것만 쓴다. 없으면 빈 배열.`,
  "- 기간, 날짜, 요금, 운영 시간은 다른 곳에 나오므로 쓰지 않는다.",
  "- 원문에 없는 내용, 추측, 홍보 문구(최고의, 놓치지 마세요 등)는 쓰지 않는다. 원문에 없는 숫자는 절대 쓰지 않는다.",
  "- 모든 입력 id에 대해 결과를 하나씩 돌려준다. 문장은 한국어 존댓말이 아닌 간결한 명사형·평서형으로 쓴다.",
].join("\n");

const OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          oneLine: { type: "string" },
          highlights: { type: "array", items: { type: "string" } },
          notes: { type: "array", items: { type: "string" } },
        },
        required: ["id", "oneLine", "highlights", "notes"],
        additionalProperties: false,
      },
    },
  },
  required: ["items"],
  additionalProperties: false,
};

const itemSchema = z
  .object({
    id: z.string(),
    oneLine: z.string().trim().min(5).max(LIMITS.oneLine),
    highlights: z.array(z.string().trim().min(2).max(LIMITS.highlight)).min(1).max(3),
    notes: z.array(z.string().trim().min(2).max(LIMITS.note)).max(2),
  })
  .strict();

function fail(message: string): never {
  console.error(`축제 요약을 만들지 못했어요. ${message}`);
  process.exit(1);
}

// 요약에 나온 숫자가 원문에 모두 있는지 본다(쉼표는 무시한다). 원문에 없는 숫자는 지어낸 것으로 본다.
function numbersAreInSource(texts: string[], source: string): string | undefined {
  const plainSource = source.replace(/,/g, "");
  for (const text of texts) {
    for (const n of text.replace(/,/g, "").match(/\d+/g) ?? []) {
      if (!plainSource.includes(n)) return n;
    }
  }
  return undefined;
}

function summarizeBatch(batch: SourceFestival[]): unknown[] {
  const result = spawnSync(
    "claude",
    [
      "-p",
      "아래 축제들을 규칙대로 요약해 줘.",
      "--tools",
      "",
      "--no-session-persistence",
      "--output-format",
      "json",
      "--json-schema",
      JSON.stringify(OUTPUT_SCHEMA),
      "--system-prompt",
      SYSTEM_PROMPT,
    ],
    { input: JSON.stringify(batch), encoding: "utf8", maxBuffer: 20 * 1024 * 1024, timeout: 5 * 60 * 1000 },
  );
  if (result.error) fail(`claude 명령을 실행하지 못했어요. Claude Code가 설치돼 있고 로그인돼 있는지 확인해 주세요. (${result.error.message})`);
  if (result.status !== 0) fail(`claude 명령이 실패했어요. (종료 코드 ${result.status}) ${result.stderr.slice(0, 300)}`);
  const out = JSON.parse(result.stdout) as { is_error?: boolean; structured_output?: { items?: unknown[] }; result?: string };
  if (out.is_error) fail(`claude가 오류를 돌려줬어요. ${String(out.result).slice(0, 300)}`);
  return out.structured_output?.items ?? [];
}

const festivalFile = JSON.parse(readFileSync(FESTIVALS, "utf8")) as { festivals: SourceFestival[] };
const existing: Record<string, Summary> = existsSync(OUTPUT)
  ? (JSON.parse(readFileSync(OUTPUT, "utf8")) as { summaries: Record<string, Summary> }).summaries
  : {};
const all = process.argv.includes("--all");
const today = todayInKorea();

// 목록에서 사라진 축제의 요약은 지운다.
const summaries: Record<string, Summary> = {};
for (const f of festivalFile.festivals) if (existing[f.id]) summaries[f.id] = existing[f.id];

const targets = festivalFile.festivals.filter(
  (f) => f.overview && (all || summaries[f.id]?.sourceHash !== festivalSourceHash(f)),
);
console.log(`요약할 축제 ${targets.length}건 (전체 ${festivalFile.festivals.length}건, ${BATCH_SIZE}건씩 묶어 부른다)`);

let made = 0;
const rejected: string[] = [];
for (let i = 0; i < targets.length; i += BATCH_SIZE) {
  const batch = targets.slice(i, i + BATCH_SIZE).map(({ id, name, overview, program, subEvent }) => ({ id, name, overview, program, subEvent }));
  const items = summarizeBatch(batch);
  for (const festival of batch) {
    const raw = items.find((it) => (it as { id?: string }).id === festival.id);
    const parsed = itemSchema.safeParse(raw);
    if (!parsed.success) {
      rejected.push(`${festival.name}: 형식이 맞지 않음`);
      continue;
    }
    const { oneLine, highlights, notes } = parsed.data;
    const source = [festival.name, festival.overview, festival.program, festival.subEvent].filter(Boolean).join("\n");
    const strange = numbersAreInSource([oneLine, ...highlights, ...notes], source);
    if (strange) {
      rejected.push(`${festival.name}: 원문에 없는 숫자 "${strange}"`);
      continue;
    }
    summaries[festival.id] = { sourceHash: festivalSourceHash(festival), oneLine, highlights, notes, summarizedOn: today };
    made++;
  }
  console.log(`- ${Math.min(i + BATCH_SIZE, targets.length)}/${targets.length}건 처리`);
}

// 파일은 id 순서로 저장해서 실행할 때마다 순서가 바뀌지 않게 한다.
const sorted = Object.fromEntries(Object.entries(summaries).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
writeFileSync(OUTPUT, `${JSON.stringify({ summaries: sorted }, null, 2)}\n`, "utf8");
console.log(`content/festival-summaries.json을 저장했어요. 새로 만든 요약 ${made}건, 전체 요약 ${Object.keys(sorted).length}건.`);
for (const r of rejected) console.log(`- 버린 요약: ${r}`);
