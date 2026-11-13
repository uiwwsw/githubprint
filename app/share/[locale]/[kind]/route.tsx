import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { localeSchema, templateSchema } from "@/lib/schemas";
import { getTemplateGuide, TEMPLATE_IDS } from "@/lib/template-guides";

export const runtime = "nodejs";
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return ["ko", "en"].flatMap((locale) =>
    ["home", ...TEMPLATE_IDS].map((kind) => ({ locale, kind: `${kind}.png` })),
  );
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ locale: string; kind: string }> },
) {
  const values = await params;
  const locale = localeSchema.safeParse(values.locale);
  const kind = values.kind.replace(/\.png$/, "");
  const template = templateSchema.safeParse(kind);
  if (
    !locale.success ||
    (!template.success && kind !== "home") ||
    !values.kind.endsWith(".png")
  ) {
    return new Response("Not found", { status: 404 });
  }
  const ko = locale.data === "ko";
  const heading = template.success
    ? getTemplateGuide(template.data, locale.data).ogTitle
    : ko
      ? "GitHub에 남긴 것으로\n쓰는 이력서"
      : "A resume written from\nwhat you put on GitHub";
  const font = await readFile(
    join(process.cwd(), "public/fonts/Pretendard-SemiBold.ttf"),
  );
  const ink = "#26292e";
  const proof = "#c0392b";
  const notes = ko
    ? ["README와 프로필 소개", "프로필에 고정한 저장소", "저장소 파일에서 확인한 기술"]
    : ["From READMEs and your bio", "Pinned repositories", "Tools found in repository files"];
  const blocks = [
    { top: 196, height: 46 },
    { top: 282, height: 92 },
    { top: 414, height: 30 },
  ];
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        background: "#e7e8ea",
        color: ink,
        padding: "56px 64px",
        fontFamily: "Pretendard",
        position: "relative",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", width: 560 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            fontSize: 28,
          }}
        >
          <div
            style={{
              display: "flex",
              position: "relative",
              width: 34,
              height: 34,
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 7,
                top: 7,
                width: 20,
                height: 20,
                borderRadius: 999,
                border: `3px solid ${ink}`,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 15.5,
                top: 0,
                width: 3,
                height: 34,
                background: ink,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 15.5,
                width: 34,
                height: 3,
                background: ink,
              }}
            />
          </div>
          GitHubPrint
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: ko ? 58 : 52,
            lineHeight: 1.18,
            letterSpacing: -2,
            marginTop: template.success ? 70 : 96,
          }}
        >
          {heading.split("\n").map((line) => (
            <div key={line} style={{ display: "flex" }}>
              {line}
            </div>
          ))}
        </div>
        <div
          style={{
            display: "flex",
            color: "#5d636b",
            fontSize: 24,
            marginTop: 30,
          }}
        >
          {template.success
            ? ko
              ? `${kind[0].toUpperCase()}${kind.slice(1)} 템플릿 · PDF, Word, HTML`
              : `${kind[0].toUpperCase()}${kind.slice(1)} template · PDF, Word, HTML`
            : ko
              ? "공개 GitHub 자료로 만드는 A4 개발자 문서"
              : "A4 developer documents from public GitHub work"}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          display: "flex",
          flexDirection: "column",
          left: 660,
          top: 70,
          width: 300,
          height: 560,
          background: "white",
          padding: "34px 30px",
          boxShadow: "0 18px 40px rgba(38,41,46,0.25)",
        }}
      >
        <div style={{ display: "flex", fontSize: 34, letterSpacing: -1 }}>
          {ko ? "김하늘" : "Alex Morgan"}
        </div>
        <div style={{ display: "flex", fontSize: 15, marginTop: 6 }}>
          {ko ? "웹 인터페이스를 만드는 개발자" : "Developer building web interfaces"}
        </div>
        <div
          style={{ display: "flex", height: 3, background: ink, marginTop: 22 }}
        />
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            style={{
              display: "flex",
              flexDirection: "column",
              position: "absolute",
              left: 30,
              top: blocks[index].top,
              width: 240,
              gap: 9,
            }}
          >
            {Array.from({ length: Math.round(blocks[index].height / 16) }).map(
              (_, line) => (
                <div
                  key={line}
                  style={{
                    display: "flex",
                    height: 7,
                    width: line % 2 ? "72%" : "100%",
                    background: "#dfe2e5",
                  }}
                />
              ),
            )}
          </div>
        ))}
      </div>
      {notes.map((note, index) => (
        <div
          key={note}
          style={{
            position: "absolute",
            display: "flex",
            alignItems: "center",
            left: 948,
            top: 70 + blocks[index].top - 4,
            height: blocks[index].height + 8,
          }}
        >
          <div
            style={{
              display: "flex",
              width: 10,
              height: "100%",
              border: `2.5px solid ${proof}`,
              borderLeft: "none",
            }}
          />
          <div
            style={{ display: "flex", width: 22, height: 2.5, background: proof }}
          />
          <div
            style={{
              display: "flex",
              width: 190,
              marginLeft: 8,
              color: proof,
              fontSize: 17,
              lineHeight: 1.3,
            }}
          >
            {note}
          </div>
        </div>
      ))}
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: [{ name: "Pretendard", data: font, weight: 600, style: "normal" }],
    },
  );
}
