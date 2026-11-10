// 후기의 실제로 쓴 비용(적은 항목만 원 단위로 보여주고 합계를 낸다)
import type { Review } from "@/lib/content";
import { formatWon } from "@/lib/format";

const LABELS = { admission: "입장료", food: "식비", transport: "교통비" } as const;

export function CostSummary({ cost }: { cost: Review["cost"] }) {
  const rows = (Object.keys(LABELS) as (keyof typeof LABELS)[])
    .filter((key) => cost?.[key] !== undefined)
    .map((key) => [LABELS[key], cost?.[key] ?? 0] as const);
  const total = rows.reduce((sum, [, amount]) => sum + amount, 0);

  return (
    <section aria-label="실제로 쓴 비용" className="rounded-[20px] border border-line bg-surface-muted p-[22px]">
      <h2 className="text-[19px] font-extrabold">
        실제로 쓴 비용
      </h2>
      {rows.length > 0 ? (
        <dl className="mt-3.5 grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-2.5 text-[15px]">
          {rows.map(([label, amount]) => (
            <div key={label} className="contents">
              <dt className="text-ink-muted">{label}</dt>
              <dd className="text-right">{formatWon(amount)}</dd>
            </div>
          ))}
          <div className="contents">
            <dt className="border-t border-line pt-2.5 font-extrabold">합계</dt>
            <dd className="border-t border-line pt-2.5 text-right font-extrabold">{formatWon(total)}</dd>
          </div>
        </dl>
      ) : (
        <p className="mt-3 text-[15px] text-ink-muted">기록한 비용이 없어요.</p>
      )}
    </section>
  );
}
