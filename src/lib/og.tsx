// 공유 미리보기 이미지(1200×630)를 그리는 함수. 한글 글꼴은 빌드 때 Google Fonts에서 필요한 글자만 받는다.
import { cacheLife } from "next/cache";
import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/site";

export const OG_SIZE = { width: 1200, height: 630 };

// 이미지 안에서는 CSS 토큰을 쓸 수 없어 globals.css의 같은 값을 여기에만 적는다.
const COLORS = {
  background: "#eaf4ff", // surface-accent
  ink: "#1b2733", // ink
  inkSoft: "#3a4754", // ink-soft
  sun: "#f08c00", // sun
};

// Noto Sans KR에서 text에 쓰인 글자만 담은 TTF를 받는다.
// 네트워크 요청이 있으면 이미지를 미리 만들 수 없으므로 결과를 캐시해 빌드 때 이미지를 만든다(내장 문서 route-handlers의 Cache Components).
async function loadFont(text: string, weight: 500 | 800): Promise<ArrayBuffer> {
  "use cache";
  cacheLife("max");
  const cssUrl = `https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@${weight}&text=${encodeURIComponent(text)}`;
  const css = await (await fetch(cssUrl)).text();
  const fontUrl = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
  if (!fontUrl) throw new Error("공유 이미지에 쓸 한글 글꼴을 받지 못했어요.");
  return (await fetch(fontUrl)).arrayBuffer();
}

type Props = { title: string; caption: string };

// 위에 해 아이콘과 사이트 이름, 가운데 큰 제목, 아래에 짧은 설명을 둔다.
export async function renderOgImage({ title, caption }: Props): Promise<ImageResponse> {
  const [bold, medium] = await Promise.all([loadFont(SITE_NAME + title, 800), loadFont(caption, 500)]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: COLORS.background,
          color: COLORS.ink,
          fontFamily: "Noto Sans KR",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 40, fontWeight: 800 }}>
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke={COLORS.sun} strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
          </svg>
          {SITE_NAME}
        </div>
        <div style={{ display: "flex", fontSize: 68, fontWeight: 800, lineHeight: 1.3, whiteSpace: "pre-wrap", wordBreak: "keep-all" }}>{title}</div>
        <div style={{ display: "flex", fontSize: 32, fontWeight: 500, color: COLORS.inkSoft }}>{caption}</div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: "Noto Sans KR", data: bold, weight: 800, style: "normal" },
        { name: "Noto Sans KR", data: medium, weight: 500, style: "normal" },
      ],
    },
  );
}
