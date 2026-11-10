// 여행후기 목록의 필터 영역(지역 2단계 선택, 누구와 칩, 태그 칩)
import Form from "next/form";
import Link from "next/link";
import { AutoSubmitSelect } from "@/components/AutoSubmitSelect";
import { COMPANIONS, FILTER_TAGS } from "@/lib/content";
import { filterHref, type ReviewFilters as Filters, type SidoOption } from "@/lib/review-filter";

type Props = { options: SidoOption[]; filters: Filters };

export function ReviewFilters({ options, filters }: Props) {
  const sido = options.find((option) => option.name === filters.sido);
  return (
    <section aria-label="후기 고르기" className="mt-8 flex flex-col gap-6 rounded-[20px] border border-line p-5 sm:p-6">
      <Form action="/reviews" scroll={false}>
        <fieldset>
          <legend className="text-base font-extrabold text-ink">지역</legend>
          <div className="mt-2 flex flex-wrap items-end gap-3">
            <AutoSubmitSelect
              id="filter-sido"
              name="sido"
              label="시도"
              value={filters.sido ?? ""}
              clears="sigungu"
              options={[
                { value: "", label: "전체" },
                ...options.map((option) => ({ value: option.name, label: `${option.name} (${option.count})` })),
              ]}
            />
            {sido && (
              <AutoSubmitSelect
                id="filter-sigungu"
                name="sigungu"
                label="시군구"
                value={filters.sigungu ?? ""}
                options={[
                  { value: "", label: "전체" },
                  ...sido.sigungus.map((option) => ({ value: option.name, label: `${option.name} (${option.count})` })),
                ]}
              />
            )}
            {filters.companion && <input type="hidden" name="companion" value={filters.companion} />}
            {filters.tag && <input type="hidden" name="tag" value={filters.tag} />}
            <noscript>
              <button
                type="submit"
                className="h-12 rounded-xl bg-primary px-5 font-bold text-white"
              >
                적용
              </button>
            </noscript>
          </div>
        </fieldset>
      </Form>
      <ChipGroup
        id="filter-companion"
        label="누구와"
        values={COMPANIONS}
        current={filters.companion}
        hrefFor={(value) => filterHref(filters, { companion: value })}
      />
      <ChipGroup
        id="filter-tag"
        label="태그"
        values={FILTER_TAGS}
        current={filters.tag}
        hrefFor={(value) => filterHref(filters, { tag: value })}
      />
    </section>
  );
}

type ChipGroupProps = {
  id: string;
  label: string;
  values: readonly string[];
  current?: string;
  // 값이 빈 문자열이면 이 조건을 지운 주소를 돌려준다.
  hrefFor: (value: string) => string;
};

function ChipGroup({ id, label, values, current, hrefFor }: ChipGroupProps) {
  const chips = [{ value: "", label: "전체" }, ...values.map((value) => ({ value, label: value }))];
  return (
    <div role="group" aria-labelledby={id}>
      <p id={id} className="text-base font-extrabold text-ink">
        {label}
      </p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {chips.map((chip) => {
          const selected = (current ?? "") === chip.value;
          return (
            <li key={chip.label}>
              <Link
                href={hrefFor(selected ? "" : chip.value)}
                scroll={false}
                aria-current={selected ? "true" : undefined}
                className={`inline-flex min-h-11 items-center rounded-full border px-4 text-[15px] ${
                  selected
                    ? "border-primary bg-primary font-bold text-white"
                    : "border-line-strong bg-surface font-medium text-ink-soft hover:border-primary"
                }`}
              >
                {chip.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
