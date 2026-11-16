// 여행추천에 쓰는 명소 자료(attractions.json), 붐빔 예측(attraction-crowd.json), 시군구 대표 좌표(region-centers.json)를 읽고 검사한다.
// 빌드 전 검사 스크립트(scripts/check-content.ts)도 Node로 직접 불러 쓰므로 다른 로컬 파일을 import하지 않는다.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";

const CONTENT_DIR = path.join(process.cwd(), "content");
const text = z.string().min(1);
const webUrl = z.url({ protocol: /^https?$/ });
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const ATTRACTION_BADGES = ["한국관광 100선", "유네스코 세계유산", "사적", "명승", "100대 명산", "해수욕장", "직접 가봄"] as const;

const attractionSchema = z
  .object({
    id: z.string().regex(/^\d+$/),
    name: text,
    contentTypeId: text,
    sido: text,
    sigungu: text,
    address: text.optional(),
    lat: z.number().min(33).max(39),
    lng: z.number().min(124).max(132),
    group: z.string().optional(),
    category: z.string().optional(),
    kind: z.string().optional(),
    indoor: z.boolean(),
    image: z.object({ url: webUrl, license: z.enum(["Type1", "Type3"]) }).strict().optional(),
    badges: z.array(z.enum(ATTRACTION_BADGES)),
    inCrowdList: z.boolean(),
    score: z.number(),
    modifiedTime: z.string(),
    detail: z
      .object({
        overview: text.optional(),
        homepage: webUrl.optional(),
        phone: text.optional(),
        useTime: text.optional(),
        restDate: text.optional(),
        fee: text.optional(),
        parking: text.optional(),
        babyCarriage: text.optional(),
        pet: text.optional(),
        expAge: text.optional(),
        modifiedTime: z.string(),
      })
      .strict()
      .optional(),
    foods: z
      .array(
        z
          .object({
            id: z.string().regex(/^\d+$/).optional(),
            name: text,
            distance: z.number().int().min(0),
            address: text.optional(),
            badges: z.array(z.enum(["모범음식점", "백년가게", "위생등급 지정"])).optional(),
          })
          .strict(),
      )
      .optional(),
    foodsFor: z.string().optional(),
    parkings: z
      .array(
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
      )
      .optional(),
  })
  .strict();

const attractionFileSchema = z.object({ fetchedOn: date, sources: z.record(z.string(), z.string()), attractions: z.array(attractionSchema) }).strict();
const crowdFileSchema = z.object({ fetchedOn: date, crowd: z.record(z.string(), z.record(date, z.number().min(0).max(100))) }).strict();
const centerFileSchema = z
  .object({
    fetchedOn: date,
    method: text,
    centers: z.record(z.string().regex(/^\d{5}$/), z.object({ lat: z.number(), lng: z.number(), samples: z.number().int() }).strict()),
  })
  .strict();

export type Attraction = z.infer<typeof attractionSchema>;
export type AttractionBadge = (typeof ATTRACTION_BADGES)[number];
export type AttractionData = {
  attractions: Attraction[];
  crowd: Record<string, Record<string, number>>; // 명소 id → 날짜 → 집중률(가장 붐빌 때 100)
  centers: Record<string, { lat: number; lng: number }>; // 시군구 code → 대표 좌표(관광지 좌표 중앙값, 대략)
  fetchedOn: string;
  crowdFetchedOn: string;
};

function read<T>(file: string, schema: z.ZodType<T>): T {
  const full = path.join(CONTENT_DIR, file);
  if (!existsSync(full)) throw new Error(`content/${file}: 파일이 없어요.`);
  const result = schema.safeParse(JSON.parse(readFileSync(full, "utf8")));
  if (!result.success) {
    const issues = result.error.issues.slice(0, 5).map((i) => `${i.path.join(".")}: ${i.message}`);
    throw new Error(`content/${file} 검사에서 문제를 찾았어요.\n- ${issues.join("\n- ")}`);
  }
  return result.data;
}

let cached: AttractionData | undefined;

// 배포된 파일은 바뀌지 않으므로 한 번 읽은 뒤 다시 쓴다.
export function loadAttractionData(): AttractionData {
  if (cached) return cached;
  const a = read("attractions.json", attractionFileSchema);
  const c = read("attraction-crowd.json", crowdFileSchema);
  const r = read("region-centers.json", centerFileSchema);
  const ids = new Set<string>();
  for (const at of a.attractions) {
    if (ids.has(at.id)) throw new Error(`content/attractions.json: id ${at.id}가 두 번 이상 있어요.`);
    ids.add(at.id);
  }
  cached = {
    attractions: a.attractions,
    crowd: c.crowd,
    centers: Object.fromEntries(Object.entries(r.centers).map(([k, v]) => [k, { lat: v.lat, lng: v.lng }])),
    fetchedOn: a.fetchedOn,
    crowdFetchedOn: c.fetchedOn,
  };
  return cached;
}
