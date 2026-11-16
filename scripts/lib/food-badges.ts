// 먹을 곳에 공식 표시(모범음식점, 백년가게, 위생등급 지정)를 붙이는 함수(build-attractions, build-festivals가 함께 쓴다)
// 인허가번호(관광공사 음식점 상세)로 먼저 맞추고, 없으면 "시도|시군구|이름"으로 맞춘다.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { badgeKey } from "../../src/lib/badges.ts";

type BadgeIndex = { restaurants: Record<string, string[]>; licenses?: Record<string, string[]> };
type Food = { id?: string; name: string; distance: number; address?: string; badges?: string[] };

const CONTENT = path.join(process.cwd(), "content");

export function loadBadgeSources() {
  const indexPath = path.join(CONTENT, "badge-index.json");
  const detailPath = path.join(CONTENT, "food-details.json");
  const index = existsSync(indexPath) ? (JSON.parse(readFileSync(indexPath, "utf8")) as BadgeIndex) : undefined;
  const details = existsSync(detailPath) ? (JSON.parse(readFileSync(detailPath, "utf8")) as { details: Record<string, { licenseNo?: string }> }).details : {};
  return { index, details };
}

export function attachFoodBadges<T extends Food>(foods: T[] | undefined, sources: ReturnType<typeof loadBadgeSources>): T[] | undefined {
  if (!foods || !sources.index) return foods;
  const { index, details } = sources;
  return foods.map((food) => {
    const { badges: _old, ...rest } = food;
    void _old;
    const license = food.id ? details[food.id]?.licenseNo : undefined;
    const byLicense = license ? (index.licenses?.[license] ?? []) : [];
    const byName = index.restaurants[badgeKey(food.name, food.address) ?? ""] ?? [];
    const badges = [...new Set([...byLicense, ...byName])];
    return (badges.length ? { ...rest, badges } : rest) as T;
  });
}
