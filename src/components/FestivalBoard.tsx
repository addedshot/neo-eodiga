// 지역축제 페이지 본문(시도 고르기, 월 달력, 목록). 오늘 날짜와 주소 쿼리로 요청 때 그린다.
import Form from "next/form";
import Link from "next/link";
import { connection } from "next/server";
import { AutoSubmitSelect } from "@/components/AutoSubmitSelect";
import { FestivalCalendar } from "@/components/FestivalCalendar";
import { FestivalList } from "@/components/FestivalList";
import { loadContent } from "@/lib/content";
import { isOnDate, todayInKorea, visibleFestivals } from "@/lib/festivals";

type Query = Record<string, string | string[] | undefined>;
type Filters = { month: string; date?: string; sido?: string };

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

function festivalsHref({ month, date, sido }: Filters): string {
  const params = new URLSearchParams({ month });
  if (date) params.set("date", date);
  if (sido) params.set("sido", sido);
  return `/festivals?${params}`;
}

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return d.toISOString().slice(0, 7);
}

export async function FestivalBoard({ searchParams }: { searchParams: Promise<Query> }) {
  const query = await searchParams;
  await connection();
  const today = todayInKorea();
  const { regions, festivals } = loadContent();
  const shown = visibleFestivals(festivals, today);

  // 시도 선택지는 지금 보여줄 축제가 있는 곳만, regions.json 순서로
  const sidoCounts = new Map<string, number>();
  for (const { festival } of shown) sidoCounts.set(festival.sido, (sidoCounts.get(festival.sido) ?? 0) + 1);
  const sidoOptions = [...new Set(regions.map((r) => r.sido))].filter((s) => sidoCounts.has(s));

  const monthParam = first(query.month) ?? "";
  const month = /^\d{4}-(0[1-9]|1[0-2])$/.test(monthParam) ? monthParam : today.slice(0, 7);
  const dateParam = first(query.date) ?? "";
  const date = dateParam.startsWith(`${month}-`) && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : undefined;
  const sidoParam = first(query.sido);
  const sido = sidoOptions.find((s) => s === sidoParam);
  const filters: Filters = { month, date, sido };

  const inRegion = shown.filter(({ festival }) => !sido || festival.sido === sido);
  const monthEnd = `${month}-31`;
  const listed = date
    ? inRegion.filter(({ festival }) => isOnDate(festival, date))
    : inRegion.filter(({ festival }) => festival.startDate <= monthEnd && festival.endDate >= `${month}-01`);
  const [year, mon] = month.split("-").map(Number);
  const heading = date ? `${mon}월 ${Number(date.slice(8))}일에 열리는 축제` : `${mon}월에 열리는 축제`;

  return (
    <>
      <Form action="/festivals" scroll={false} className="mt-8 flex flex-wrap items-end gap-3">
        <input type="hidden" name="month" value={month} />
        {date && <input type="hidden" name="date" value={date} />}
        <AutoSubmitSelect
          id="festival-sido"
          name="sido"
          label="지역"
          value={sido ?? ""}
          options={[
            { value: "", label: `전국 (${shown.length})` },
            ...sidoOptions.map((s) => ({ value: s, label: `${s} (${sidoCounts.get(s)})` })),
          ]}
        />
        <noscript>
          <button type="submit" className="h-12 rounded-xl bg-primary px-5 font-bold text-white">
            적용
          </button>
        </noscript>
      </Form>

      <div className="mt-6 flex flex-wrap items-start gap-8">
        <section aria-labelledby="calendar-heading" className="min-w-0 flex-[1_1_340px] rounded-[20px] border border-line p-2 sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <Link
              href={festivalsHref({ month: shiftMonth(month, -1), sido })}
              scroll={false}
              className="inline-flex min-h-11 items-center rounded-[10px] px-3 text-sm font-bold text-link"
            >
              이전 달
            </Link>
            <h2 id="calendar-heading" className="text-lg font-extrabold">
              {year}년 {mon}월
            </h2>
            <Link
              href={festivalsHref({ month: shiftMonth(month, 1), sido })}
              scroll={false}
              className="inline-flex min-h-11 items-center rounded-[10px] px-3 text-sm font-bold text-link"
            >
              다음 달
            </Link>
          </div>
          <FestivalCalendar
            month={month}
            today={today}
            selectedDate={date}
            items={inRegion}
            hrefFor={(d) => festivalsHref({ ...filters, date: d })}
          />
        </section>

        <section aria-labelledby="list-heading" className="min-w-0 flex-[999_1_480px]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="list-heading" className="text-xl font-extrabold">
              {heading} {listed.length}개
            </h2>
            {date && (
              <Link
                href={festivalsHref({ ...filters, date: undefined })}
                scroll={false}
                className="inline-flex min-h-11 items-center text-sm font-bold text-link"
              >
                날짜 선택 지우기
              </Link>
            )}
          </div>
          {listed.length > 0 ? (
            <div className="mt-3 rounded-[20px] border border-line px-5">
              <FestivalList items={listed} today={today} />
            </div>
          ) : (
            <p className="mt-3 rounded-[20px] bg-surface-muted p-6 text-ink-muted">이 기간에 열리는 축제가 없어요.</p>
          )}
        </section>
      </div>
    </>
  );
}
