// 먹을 곳 상세(content/food-details.json, npm run build-food-details)를 읽는다. 파일이 없거나 그 곳이 아직 없으면 undefined.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";

const text = z.string().min(1);
const detailSchema = z
  .object({
    firstMenu: text.optional(),
    treatMenu: text.optional(),
    openTime: text.optional(),
    restDate: text.optional(),
    parking: text.optional(),
    packing: text.optional(),
    reservation: text.optional(),
    kidsFacility: z.boolean().optional(),
    licenseNo: z.string().regex(/^\d{8,}$/).optional(),
    fetchedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  })
  .strict();
const fileSchema = z.object({ fetchedOn: z.string(), details: z.record(z.string().regex(/^\d+$/), detailSchema) }).strict();

export type FoodDetail = z.infer<typeof detailSchema>;
let cached: Record<string, FoodDetail> | undefined;

export function loadFoodDetails(): Record<string, FoodDetail> {
  if (cached) return cached;
  const file = path.join(process.cwd(), "content", "food-details.json");
  if (!existsSync(file)) return (cached = {});
  const result = fileSchema.safeParse(JSON.parse(readFileSync(file, "utf8")));
  if (!result.success) throw new Error(`content/food-details.json 검사에서 문제를 찾았어요. ${result.error.issues[0]?.message ?? ""}`);
  return (cached = result.data.details);
}

export const foodDetailOf = (id: string | undefined) => (id ? loadFoodDetails()[id] : undefined);
