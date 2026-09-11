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
      ? "GitHub 기록을\nPDF와 Word로."
      : "Your GitHub work.\nReady for PDF & Word.";
  const font = await readFile(
    join(process.cwd(), "public/fonts/Pretendard-SemiBold.ttf"),
  );
  const sections = ko
    ? ["프로필과 핵심 기술", "대표 프로젝트", "작업의 근거"]
    : ["PROFILE & SKILLS", "SELECTED PROJECTS", "THE WORK BEHIND IT"];
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        background: "#f4f7f2",
        color: "#17271d",
        padding: "58px 64px",
        fontFamily: "Pretendard",
        position: "relative",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", width: 740 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            fontSize: 27,
          }}
        >
          <span
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#176b50",
              color: "white",
              width: 44,
              height: 44,
              borderRadius: 9,
              fontSize: 28,
            }}
          >
            G/
          </span>
          GitHubPrint
        </div>
        <div
          style={{
            display: "flex",
            color: "#537863",
            fontSize: 17,
            letterSpacing: 3,
            marginTop: 60,
          }}
        >
          {kind === "home"
            ? "YOUR WORK, WELL DOCUMENTED"
            : `${kind.toUpperCase()} / TEMPLATE GUIDE`}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: ko ? 60 : 54,
            lineHeight: 1.2,
            letterSpacing: -2,
            marginTop: 24,
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
            color: "#65766c",
            fontSize: 22,
            marginTop: 30,
          }}
        >
          {ko
            ? "개발자 소개서 · 포트폴리오 · 리포트 · 이력서"
            : "Developer briefs, portfolios, reports & resumes"}
        </div>
        <div
          style={{
            display: "flex",
            color: "#176b50",
            fontSize: 20,
            marginTop: 48,
          }}
        >
          PDF + DOCX / 한국어 · English
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          display: "flex",
          flexDirection: "column",
          right: 55,
          top: 90,
          width: 300,
          height: 445,
          background: "white",
          border: "1px solid #dce5df",
          borderRadius: 4,
          padding: 30,
          boxShadow: "0 20px 40px #17271d14",
          transform: "rotate(5deg)",
        }}
      >
        <div
          style={{
            display: "flex",
            color: "#71907b",
            fontSize: 13,
            paddingBottom: 18,
            borderBottom: "3px solid #176b50",
          }}
        >
          {kind === "home" ? "GITHUBPRINT" : kind.toUpperCase()}
        </div>
        <div style={{ display: "flex", fontSize: 26, marginTop: 23 }}>
          {ko ? "나의 작업, 한눈에." : "Your work, on paper."}
        </div>
        {sections.map((section) => (
          <div
            key={section}
            style={{ display: "flex", flexDirection: "column", marginTop: 30 }}
          >
            <div style={{ display: "flex", color: "#38644c", fontSize: 13 }}>
              {section}
            </div>
            <div
              style={{
                display: "flex",
                height: 5,
                width: "100%",
                background: "#e9eee9",
                marginTop: 12,
              }}
            />
            <div
              style={{
                display: "flex",
                height: 5,
                width: "75%",
                background: "#e9eee9",
                marginTop: 7,
              }}
            />
          </div>
        ))}
        <div
          style={{
            display: "flex",
            color: "#7d8f83",
            fontSize: 11,
            marginTop: 34,
          }}
        >
          A4 / {ko ? "문서 구성 예시" : "EXAMPLE LAYOUT"}
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: [{ name: "Pretendard", data: font, weight: 600, style: "normal" }],
    },
  );
}
