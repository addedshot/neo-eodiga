// 콘텐츠 파일(후기, 공지, 이용 안내, 장소, 지역)을 읽고 규칙에 맞는지 검사하는 함수 모음
// 빌드 전 검사 스크립트(scripts/check-content.ts)가 Node로 직접 실행하므로 다른 로컬 파일을 import하지 않는다.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import yaml from "js-yaml";
import { z } from "zod";

export const COMPANIONS = ["혼자", "커플", "친구", "가족", "아이와"] as const;
export const PLACE_CATEGORIES = ["관람", "식사", "숙소", "카페", "공원", "해수욕장"] as const;
// 후기 목록의 태그 필터에 나오는 태그(후기에는 다른 태그도 쓸 수 있다)
export const FILTER_TAGS = ["실내", "야외", "무료", "비 오는 날", "대중교통"] as const;

const CONTENT_DIR = path.join(process.cwd(), "content");
const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// frontmatter는 CORE 스키마로 읽는다. 날짜(2026-10-18)와 시각(10:00)이 다른 값으로 바뀌지 않고 문자열로 남는다.
const MATTER_OPTIONS = {
  engines: { yaml: (source: string) => yaml.load(source, { schema: yaml.CORE_SCHEMA }) as object },
};

// 2026-02-30처럼 달력에 없는 날짜도 걸러낸다.
const dateField = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { error: "YYYY-MM-DD 형식이어야 해요." })
  .refine((value) => new Date(`${value}T00:00:00Z`).toISOString().startsWith(value), {
    error: "달력에 없는 날짜예요.",
  });

const won = z.number().int().min(0);

const regionSchema = z
  .object({
    code: z.string().regex(/^\d{5}$/, { error: "시군구 5자리 숫자여야 해요." }),
    sido: z.string().min(1),
    sigungu: z.string().min(1),
  })
  .strict();

const placeSchema = z
  .object({
    id: z.string().regex(SLUG_PATTERN, { error: "영문 소문자, 숫자, 하이픈만 쓸 수 있어요." }),
    name: z.string().min(1),
    sido: z.string().min(1),
    sigungu: z.string().min(1),
    category: z.enum(PLACE_CATEGORIES),
    lat: z.number().min(-90).max(90).optional(),
    lng: z.number().min(-180).max(180).optional(),
    hours: z.string().min(1).optional(),
    parking: z.string().min(1).optional(),
    reservation: z.string().min(1).optional(),
    stayTime: z.string().min(1).optional(),
    goodFor: z.array(z.enum(COMPANIONS)).optional(),
    stroller: z.string().min(1).optional(),
    nursingRoom: z.string().min(1).optional(),
    visited: z.boolean(),
  })
  .strict()
  .refine((place) => (place.lat === undefined) === (place.lng === undefined), {
    error: "lat과 lng는 함께 쓰거나 함께 빼야 해요.",
    path: ["lat"],
  });

const reviewSchema = z
  .object({
    title: z.string().min(1),
    date: dateField,
    sido: z.string().min(1),
    sigungu: z.string().min(1),
    tags: z.array(z.string().min(1)),
    companion: z.enum(COMPANIONS),
    people: z.number().int().min(1),
    kidAges: z.array(z.string().min(1)).optional(),
    transport: z.string().min(1).optional(),
    route: z
      .array(
        z
          .object({
            place: z.string().min(1),
            time: z.string().regex(/^\d{2}:\d{2}$/, { error: "10:00처럼 HH:MM 형식이어야 해요." }).optional(),
            note: z.string().optional(),
          })
          .strict(),
      )
      .min(1),
    cost: z.object({ admission: won, food: won, transport: won }).partial().strict().optional(),
    cover: z.string().startsWith("/images/reviews/").optional(),
    author: z.string().min(1).optional(),
  })
  .strict()
  .refine((review) => review.kidAges === undefined || review.companion === "아이와", {
    error: "kidAges는 companion이 아이와일 때만 쓸 수 있어요.",
    path: ["kidAges"],
  });

// 지역축제는 scripts/build-festivals.ts가 한국관광공사 관광정보 API로 만든다. 사람이 쓰지 않으므로 필요한 형식만 확인한다.
const webUrl = z.url({ protocol: /^https?$/ });
const text = z.string().min(1);
const eventFields = {
  id: z.string().regex(/^\d+$/, { error: "관광공사 콘텐츠 id(숫자)여야 해요." }),
  name: text,
  startDate: dateField,
  endDate: dateField,
  sido: text,
  sigungu: text,
  place: z.string(),
  address: text.optional(),
  lat: z.number().min(33).max(39),
  lng: z.number().min(124).max(132),
  phone: text.optional(),
  host: text.optional(),
  organizer: text.optional(),
  links: z.array(z.object({ label: text.optional(), url: webUrl }).strict()),
  overview: text.optional(),
  program: text.optional(),
  playTime: text.optional(),
  fee: text.optional(),
  ageLimit: text.optional(),
  bookingPlace: text.optional(),
  // 공공누리 1유형, 3유형 사진만 넣는다. 3유형은 변경금지라 원본 주소를 그대로 보여준다.
  image: z.object({ url: webUrl, license: z.enum(["Type1", "Type3"]) }).strict().optional(),
  modifiedTime: z.string().regex(/^\d{14}$/, { error: "수정 시각은 14자리 숫자여야 해요." }),
};
// 공식 인증·지정 표시(모범음식점, 백년가게, 위생등급). 맛 평가가 아니다.
const restaurantBadge = z.enum(["모범음식점", "백년가게", "위생등급 매우 우수", "위생등급 우수", "위생등급 좋음"]);
const nearPlace = z
  .object({ name: text, distance: z.number().int().min(0), address: text.optional(), badges: z.array(restaurantBadge).min(1).optional() })
  .strict();
const festivalSchema = z
  .object({
    ...eventFields,
    subEvent: text.optional(),
    discount: text.optional(),
    spendTime: text.optional(),
    // 예약·예매·사전 신청이 적힌 원문 문장(지어내지 않는다)
    bookingNotes: z.array(text),
    lodgings: z.array(
      z
        .object({
          name: text,
          distance: z.number().int().min(0),
          address: text.optional(),
          phone: text.optional(),
          reservationUrl: webUrl.optional(),
          // 관광호텔업 결정 등급(문화체육관광부 전국호텔현황)
          grade: z.enum(["1성", "2성", "3성", "4성", "5성"]).optional(),
        })
        .strict(),
    ),
    // 축제 좌표 기준 주변 정보(관광공사 자료의 음식점, 관광지·문화시설과 공공데이터포털 주차장 표준데이터)
    foods: z.array(nearPlace),
    sights: z.array(nearPlace),
    parkings: z.array(
      z
        .object({
          name: text,
          distance: z.number().int().min(0),
          kind: text.optional(),
          spaces: z.number().int().min(1).optional(),
          feeType: text.optional(),
          basicFee: text.optional(),
          weekdayHours: text.optional(),
        })
        .strict(),
    ),
  })
  .strict()
  .refine((f) => f.startDate <= f.endDate, { error: "끝나는 날이 시작일보다 앞서요.", path: ["endDate"] });
// 1월 1일~12월 31일로 적힌 상설 행사. 목록에는 없고 축제 포스트의 "주변 상설 행사"에만 나온다.
const ongoingEventSchema = z.object(eventFields).strict();
const festivalFileSchema = z
  .object({
    source: z.url(),
    fetchedOn: dateField,
    parkingSource: z.object({ url: z.url(), referenceDate: dateField }).strict(),
    festivals: z.array(z.unknown()),
    ongoingEvents: z.array(z.unknown()),
  })
  .strict();
// 축제 요약(scripts/summarize-festivals.ts가 운영자 PC에서 만든다). 원문 해시가 지금 원문과 같을 때만 화면에 쓴다.
const festivalSummarySchema = z
  .object({
    sourceHash: z.string().regex(/^[0-9a-f]{8}$/, { error: "16진수 8자리여야 해요." }),
    oneLine: text,
    highlights: z.array(text).min(1).max(3),
    notes: z.array(text).max(2),
    summarizedOn: dateField,
  })
  .strict();
const festivalSummaryFileSchema = z.object({ summaries: z.record(z.string().regex(/^\d+$/), festivalSummarySchema) }).strict();

const noticeSchema = z.object({ title: z.string().min(1), date: dateField }).strict();
const guideSchema = z.object({ title: z.string().min(1), order: z.number().int().min(1) }).strict();

export type Region = z.infer<typeof regionSchema>;
export type Place = z.infer<typeof placeSchema>;
export type Companion = (typeof COMPANIONS)[number];
export type Review = z.infer<typeof reviewSchema> & { slug: string };
export type Notice = z.infer<typeof noticeSchema> & { slug: string };
export type Guide = z.infer<typeof guideSchema> & { slug: string };

export type Festival = z.infer<typeof festivalSchema>;
export type OngoingEvent = z.infer<typeof ongoingEventSchema>;
export type FestivalSummary = z.infer<typeof festivalSummarySchema>;

export type Content = {
  regions: Region[];
  places: Place[];
  reviews: Review[];
  notices: Notice[];
  guides: Guide[];
  festivals: Festival[];
  ongoingEvents: OngoingEvent[];
  // 축제 id별 요약. 요약 파일이 없으면 빈 묶음이다.
  festivalSummaries: Record<string, FestivalSummary>;
  // 축제 자료를 받은 날(YYYY-MM-DD)과 출처 주소, 주차장 자료의 기준일과 출처 주소
  festivalSource: { url: string; fetchedOn: string };
  parkingSource: { url: string; referenceDate: string };
};

const TYPE_NAMES: Record<string, string> = {
  string: "문자열",
  number: "숫자",
  int: "정수",
  boolean: "true 또는 false",
  array: "목록",
  object: "항목 묶음",
};

// 검사에서 찾은 문제를 한국어 한 줄로 바꾼다.
function describeIssue(issue: z.core.$ZodIssue): string {
  const field = issue.path.length > 0 ? issue.path.join(".") : "(전체)";
  const input = "input" in issue ? issue.input : undefined;
  if ((issue.code === "invalid_type" || issue.code === "invalid_value") && input === undefined) {
    return `${field}: 필수 항목이 없어요.`;
  }
  switch (issue.code) {
    case "invalid_type":
      return `${field}: ${TYPE_NAMES[issue.expected] ?? issue.expected} 형식이어야 해요. (지금 값: ${JSON.stringify(input)})`;
    case "invalid_value":
      return `${field}: ${JSON.stringify(input)}은(는) 쓸 수 없는 값이에요. (${issue.values.join(" | ")})`;
    case "too_small":
      return `${field}: ${issue.origin === "array" ? `${issue.minimum}개 이상` : `${issue.minimum} 이상`}이어야 해요.`;
    case "unrecognized_keys":
      return `${issue.keys.join(", ")}: 정해지지 않은 항목이에요.`;
    default:
      return `${field}: ${issue.message}`;
  }
}

function check<T>(schema: z.ZodType<T>, data: unknown, file: string, errors: string[]): T | undefined {
  const result = schema.safeParse(data, { reportInput: true });
  if (result.success) return result.data;
  for (const issue of result.error.issues) errors.push(`${file}: ${describeIssue(issue)}`);
  return undefined;
}

function readJsonValue(file: string, errors: string[]): unknown {
  const full = path.join(CONTENT_DIR, file);
  if (!existsSync(full)) {
    errors.push(`content/${file}: 파일이 없어요.`);
    return undefined;
  }
  return JSON.parse(readFileSync(full, "utf8"));
}

function readJson(file: string, errors: string[]): unknown[] {
  const full = path.join(CONTENT_DIR, file);
  if (!existsSync(full)) {
    errors.push(`content/${file}: 파일이 없어요.`);
    return [];
  }
  const data: unknown = JSON.parse(readFileSync(full, "utf8"));
  if (!Array.isArray(data)) {
    errors.push(`content/${file}: 배열이어야 해요.`);
    return [];
  }
  return data;
}

function readMdxDir<T>(dir: string, schema: z.ZodType<T>, errors: string[]): (T & { slug: string })[] {
  const full = path.join(CONTENT_DIR, dir);
  if (!existsSync(full)) return [];
  const items: (T & { slug: string })[] = [];
  for (const name of readdirSync(full).filter((n) => n.endsWith(".mdx")).sort()) {
    const file = `content/${dir}/${name}`;
    const slug = name.slice(0, -".mdx".length);
    if (!SLUG_PATTERN.test(slug)) {
      errors.push(`${file}: 파일 이름은 영문 소문자, 숫자, 하이픈만 쓸 수 있어요.`);
      continue;
    }
    const { data } = matter(readFileSync(path.join(full, name), "utf8"), MATTER_OPTIONS);
    const parsed = check(schema, data, file, errors);
    if (parsed) items.push({ ...parsed, slug });
  }
  return items;
}

// 모든 콘텐츠를 읽어 검사한다. 문제가 하나라도 있으면 전부 모아서 오류를 던진다.
export function loadContent(): Content {
  const errors: string[] = [];

  const regions = readJson("regions.json", errors)
    .map((item, i) => check(regionSchema, item, `content/regions.json[${i}]`, errors))
    .filter((r): r is Region => r !== undefined);
  const regionKeys = new Set(regions.map((r) => `${r.sido}/${r.sigungu}`));
  if (new Set(regions.map((r) => r.code)).size !== regions.length) {
    errors.push("content/regions.json: 같은 code가 두 번 이상 있어요.");
  }

  const checkRegion = (where: string, sido: string, sigungu: string) => {
    if (!regionKeys.has(`${sido}/${sigungu}`)) {
      errors.push(`${where}: 시도·시군구 "${sido} ${sigungu}"이(가) regions.json에 없어요.`);
    }
  };

  const places = readJson("places.json", errors)
    .map((item, i) => check(placeSchema, item, `content/places.json[${i}]`, errors))
    .filter((p): p is Place => p !== undefined);
  const placeIds = new Set<string>();
  for (const place of places) {
    if (placeIds.has(place.id)) errors.push(`content/places.json: id "${place.id}"가 두 번 이상 있어요.`);
    placeIds.add(place.id);
    checkRegion(`content/places.json(${place.id})`, place.sido, place.sigungu);
  }

  const reviews = readMdxDir("reviews", reviewSchema, errors);
  for (const review of reviews) {
    const file = `content/reviews/${review.slug}.mdx`;
    checkRegion(file, review.sido, review.sigungu);
    for (const stop of review.route) {
      if (!placeIds.has(stop.place)) errors.push(`${file}: route의 장소 id "${stop.place}"가 places.json에 없어요.`);
    }
  }

  // 공지는 최신순, 이용 안내는 order 순으로 돌려준다.
  const notices = readMdxDir("notices", noticeSchema, errors).sort(
    (a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug),
  );
  const guides = readMdxDir("guide", guideSchema, errors).sort((a, b) => a.order - b.order);
  if (new Set(guides.map((g) => g.order)).size !== guides.length) {
    errors.push("content/guide: 같은 order가 두 번 이상 있어요.");
  }

  // 지역축제(content/festivals.json)
  const festivalFile = check(festivalFileSchema, readJsonValue("festivals.json", errors), "content/festivals.json", errors);
  const festivals = (festivalFile?.festivals ?? [])
    .map((item, i) => check(festivalSchema, item, `content/festivals.json festivals[${i}]`, errors))
    .filter((f): f is Festival => f !== undefined);
  const ongoingEvents = (festivalFile?.ongoingEvents ?? [])
    .map((item, i) => check(ongoingEventSchema, item, `content/festivals.json ongoingEvents[${i}]`, errors))
    .filter((e): e is OngoingEvent => e !== undefined);
  const festivalIds = new Set<string>();
  for (const event of [...festivals, ...ongoingEvents]) {
    const where = `content/festivals.json(${event.id} ${event.name})`;
    if (festivalIds.has(event.id)) errors.push(`${where}: id가 두 번 이상 있어요.`);
    festivalIds.add(event.id);
    checkRegion(where, event.sido, event.sigungu);
  }

  // 축제 요약(content/festival-summaries.json). 아직 만들지 않았으면 없어도 된다.
  const summaryFile = existsSync(path.join(CONTENT_DIR, "festival-summaries.json"))
    ? check(festivalSummaryFileSchema, readJsonValue("festival-summaries.json", errors), "content/festival-summaries.json", errors)
    : undefined;
  const festivalSummaries = summaryFile?.summaries ?? {};

  if (errors.length > 0) {
    throw new Error(`콘텐츠 검사에서 문제 ${errors.length}개를 찾았어요.\n- ${errors.join("\n- ")}`);
  }
  return {
    regions,
    places,
    reviews,
    notices,
    guides,
    festivals,
    ongoingEvents,
    festivalSummaries,
    festivalSource: { url: festivalFile?.source ?? "", fetchedOn: festivalFile?.fetchedOn ?? "" },
    parkingSource: festivalFile?.parkingSource ?? { url: "", referenceDate: "" },
  };
}
