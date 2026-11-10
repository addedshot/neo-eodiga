// 값을 바꾸면 바로 폼을 제출하는 선택칸(자바스크립트가 없으면 폼의 적용 버튼으로 제출한다)
"use client";

type Option = { value: string; label: string };

type Props = {
  id: string;
  name: string;
  label: string;
  value: string;
  options: Option[];
  // 이 칸을 바꿀 때 함께 비울 다른 칸의 name(예: 시도를 바꾸면 시군구)
  clears?: string;
};

export function AutoSubmitSelect({ id, name, label, value, options, clears }: Props) {
  return (
    <div className="flex min-w-40 flex-1 flex-col gap-1.5 sm:flex-none">
      <label htmlFor={id} className="text-sm font-bold text-ink-soft">
        {label}
      </label>
      <select
        // 주소가 바뀌어 value가 달라지면 선택칸을 새로 그린다.
        key={value}
        id={id}
        name={name}
        defaultValue={value}
        onChange={(event) => {
          const form = event.currentTarget.form;
          if (!form) return;
          if (clears) {
            const target = form.elements.namedItem(clears);
            if (target instanceof HTMLSelectElement) target.value = "";
          }
          // 빈 값은 주소에 남기지 않는다.
          for (const element of Array.from(form.elements)) {
            if (element instanceof HTMLSelectElement && element.value === "") element.disabled = true;
          }
          form.requestSubmit();
        }}
        className="h-12 rounded-xl border border-line-strong bg-surface px-3 text-base text-ink"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
