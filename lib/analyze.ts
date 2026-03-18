import "server-only";

import { unstable_cache } from "next/cache";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { profileEngineConfig } from "@/lib/data-loader";
import type { GitHubRepoSnapshot, GitHubSourceData } from "@/lib/github";
import { buildRuleBasedAnalysis } from "@/lib/narrative-writer";
import { extractProfileFeatures } from "@/lib/profile-features";
import { scoreProfile } from "@/lib/rule-engine";
import type { Locale } from "@/lib/schemas";
import { analysisSchema, type GitFolioAnalysis } from "@/lib/schemas";

export type AnalysisResult = {
  analysis: GitFolioAnalysis;
  mode: "openai" | "fallback";
};

const ANALYSIS_CACHE_SECONDS = 60 * 15;

function repoSignalText(repo: GitHubRepoSnapshot, locale: Locale) {
  const parts = [
    `${repo.stars} stars`,
    repo.readme
      ? locale === "ko"
        ? "README 있음"
        : "README available"
      : locale === "ko"
        ? "README 없음"
        : "README missing",
    repo.homepageUrl
      ? locale === "ko"
        ? "demo/homepage 있음"
        : "demo/homepage available"
      : null,
    repo.isPinned ? (locale === "ko" ? "pinned repo" : "pinned repo") : null,
    repo.language
      ? locale === "ko"
        ? `주 언어 ${repo.language}`
        : `primary language ${repo.language}`
      : null,
  ].filter(Boolean);

  return parts.join(" / ");
}

function detectOrientation(source: GitHubSourceData) {
  const text = [
    source.account.bio ?? "",
    ...source.representativeRepos.flatMap((repo) => [
      repo.name,
      repo.description ?? "",
      repo.topics.join(" "),
      repo.readme ?? "",
    ]),
  ]
    .join(" ")
    .toLowerCase();

  if (
    ["react", "next.js", "frontend", "ui", "design-system", "tailwind"].some(
      (keyword) => text.includes(keyword),
    )
  ) {
    return "frontend";
  }
  if (
    ["backend", "api", "server", "database", "redis", "postgres"].some((keyword) =>
      text.includes(keyword),
    )
  ) {
    return "backend";
  }
  if (["ios", "android", "flutter", "react-native", "mobile"].some((keyword) => text.includes(keyword))) {
    return "mobile";
  }
  if (["openai", "llm", "rag", "agent", "ai", "ml"].some((keyword) => text.includes(keyword))) {
    return "ai";
  }
  return "general";
}

function buildHeadline(source: GitHubSourceData, locale: Locale) {
  const primaryLanguage = source.topLanguages[0]?.name;
  const orientation = detectOrientation(source);

  if (orientation === "frontend") {
    return locale === "ko"
      ? "사용자 경험과 제품 구현에 무게가 실린 프론트엔드 성향의 개발자"
      : "A frontend-leaning developer with clear emphasis on user experience and product implementation";
  }
  if (orientation === "backend") {
    return locale === "ko"
      ? "서비스 구조와 데이터 흐름을 정리하는 백엔드 성향의 개발자"
      : "A backend-leaning developer focused on structuring services and data flows";
  }
  if (orientation === "mobile") {
    return locale === "ko"
      ? "아이디어를 앱 형태로 빠르게 옮기는 모바일 제품 지향 개발자"
      : "A product-minded mobile developer who quickly turns ideas into app experiences";
  }
  if (orientation === "ai") {
    return locale === "ko"
      ? "AI 기능을 실제 제품 실험으로 연결하려는 응용 개발자"
      : "An applied developer trying to turn AI capabilities into real product experiments";
  }
  if (primaryLanguage) {
    return locale === "ko"
      ? `${primaryLanguage} 중심으로 결과물을 꾸준히 쌓아 온 제품형 개발자`
      : `A product-oriented developer who has steadily built visible work around ${primaryLanguage}`;
  }
  return locale === "ko"
    ? "공개 GitHub 기준으로 제품 구현 흔적이 보이는 실무형 개발자"
    : "A hands-on builder with visible product implementation signals on public GitHub";
}

function buildWorkingStyle(source: GitHubSourceData, locale: Locale) {
  const hasDemos = source.representativeRepos.some((repo) => repo.homepageUrl);
  const strongDocs = source.representativeRepos.some(
    (repo) => repo.readme && repo.readme.length > 700,
  );
  const recentSignals = source.activity.recentRepoCount >= 3;

  const clauses = [
    hasDemos
      ? locale === "ko"
        ? "결과물을 바로 확인할 수 있는 형태로 정리하려는 경향이 보입니다."
        : "There is a tendency to package work so the result can be checked immediately."
      : locale === "ko"
        ? "저장소 중심으로 구현 결과를 정리하는 편으로 보입니다."
        : "The work is primarily organized around repositories and implementation output.",
    strongDocs
      ? locale === "ko"
        ? "README가 비교적 충실한 프로젝트가 있어 설명과 맥락을 남기려는 습관도 읽힙니다."
        : "Some projects have relatively detailed READMEs, suggesting an effort to preserve context and explanation."
      : locale === "ko"
        ? "문서화보다는 구현 결과 자체로 신호를 주는 프로젝트가 더 많습니다."
        : "More projects signal through implementation output itself than through heavy documentation.",
    recentSignals
      ? locale === "ko"
        ? "최근에도 반복적으로 손을 대며 다듬는 흐름이 확인됩니다."
        : "Recent updates also suggest an iterative habit of revisiting and refining work."
      : locale === "ko"
        ? "최근 공개 활동은 제한적이어서 현재 작업 속도는 보수적으로 해석하는 편이 적절합니다."
        : "Recent public activity is limited, so current working speed should be interpreted conservatively.",
  ];

  return clauses.join(" ");
}

function buildStrengths(source: GitHubSourceData, locale: Locale) {
  const strengths = new Set<string>();
  const primaryLanguage = source.topLanguages[0]?.name;

  if (primaryLanguage) {
    strengths.add(
      locale === "ko"
        ? `${primaryLanguage} 기반 구현 경험이 공개 저장소 전반에서 일관되게 보입니다.`
        : `Implementation experience around ${primaryLanguage} appears consistently across public repositories.`,
    );
  }
  if (source.representativeRepos.some((repo) => repo.homepageUrl)) {
    strengths.add(
      locale === "ko"
        ? "실행 가능한 결과물이나 demo 링크로 산출물을 보여주는 프로젝트가 있습니다."
        : "There are projects that present output through runnable demos or linked product surfaces.",
    );
  }
  if (
    source.representativeRepos.filter((repo) => repo.readme && repo.readme.length > 400)
      .length >= 2
  ) {
    strengths.add(
      locale === "ko"
        ? "핵심 프로젝트의 README가 비교적 충실해 맥락 전달력이 좋습니다."
        : "Core projects tend to have solid READMEs, which improves context and readability.",
    );
  }
  if (source.activity.recentRepoCount >= 3) {
    strengths.add(
      locale === "ko"
        ? "최근까지 저장소를 업데이트한 이력이 있어 지속적인 작업 흐름이 관찰됩니다."
        : "Recent repository updates suggest a continued working rhythm rather than one-off activity.",
    );
  }
  if (source.representativeRepos.some((repo) => repo.stars >= 10 || repo.isPinned)) {
    strengths.add(
      locale === "ko"
        ? "대표작 후보가 비교적 선명해 포트폴리오 메시지를 빠르게 전달하기 좋습니다."
        : "Standout work is relatively easy to identify, which helps the portfolio message land quickly.",
    );
  }

  return [...strengths].slice(0, 4);
}

function buildBestFitRoles(source: GitHubSourceData, locale: Locale) {
  const orientation = detectOrientation(source);

  if (orientation === "frontend") {
    return locale === "ko"
      ? [
          "제품 중심 프론트엔드 개발",
          "프로토타입 제작이 잦은 제품팀",
          "디자인과 구현 간 연결이 중요한 역할",
        ]
      : [
          "Product-focused frontend development",
          "Product teams that prototype frequently",
          "Roles that sit close to design and implementation",
        ];
  }
  if (orientation === "backend") {
    return locale === "ko"
      ? [
          "API 및 서비스 구조 설계 역할",
          "데이터 흐름 정리가 중요한 백엔드 포지션",
          "기능 실험을 빠르게 지원하는 서버 개발",
        ]
      : [
          "API and service architecture roles",
          "Backend positions where data flow clarity matters",
          "Server-side work that supports fast product experiments",
        ];
  }
  if (orientation === "mobile") {
    return locale === "ko"
      ? [
          "모바일 제품 MVP 개발",
          "작은 팀의 앱 중심 프로토타이핑 역할",
          "빠른 반복 배포가 필요한 앱 개발",
        ]
      : [
          "Mobile MVP product development",
          "App-centric prototyping in small teams",
          "App work that benefits from quick iteration and release cycles",
        ];
  }
  if (orientation === "ai") {
    return locale === "ko"
      ? [
          "AI 기능 제품화 실험",
          "LLM 기능을 붙이는 응용 개발",
          "프로토타이핑 중심의 제품 개발",
        ]
      : [
          "AI feature productization experiments",
          "Applied development around LLM-enabled features",
          "Prototype-heavy product development",
        ];
  }

  return locale === "ko"
    ? [
        "초기 제품 MVP 구현",
        "아이디어 검증형 프로토타이핑",
        "작은 팀의 범용 제품 개발 역할",
      ]
    : [
        "Early-stage MVP implementation",
        "Prototype-led idea validation",
        "General product development in smaller teams",
      ];
}

function buildSummary(source: GitHubSourceData, locale: Locale) {
  const name = source.account.name ?? source.account.username;
  const topLanguages = source.topLanguages.slice(0, 3).map((item) => item.name);
  const projects = source.representativeRepos.slice(0, 2).map((repo) => repo.name);

  if (locale === "ko") {
    return `${name}의 공개 GitHub를 기준으로 보면 ${topLanguages.length > 0 ? topLanguages.join(", ") : "여러 기술"} 중심의 프로젝트가 두드러집니다. ${
      projects.length > 0
        ? `${projects.join(", ")} 같은 대표 저장소가 포트폴리오의 축을 이룹니다.`
        : "대표 프로젝트 신호는 제한적이지만 공개 저장소 활동 자체는 확인됩니다."
    } 공개 정보만으로 읽히는 범위 안에서 보면, 특정 기술을 깊게 파기보다 실제 결과물을 여러 형태로 쌓아가는 쪽에 가깝습니다.`;
  }

  return `Based on public GitHub signals, ${name} stands out more through projects built around ${topLanguages.length > 0 ? topLanguages.join(", ") : "multiple technologies"}. ${
    projects.length > 0
      ? `Repositories such as ${projects.join(", ")} form the clearest portfolio spine.`
      : "Signals for standout projects are limited, but public repository activity is still visible."
  } Within the limits of public evidence, the profile reads more like someone who keeps shipping tangible work in different forms than someone optimizing for a single narrow technical specialty.`;
}

function buildFallbackAnalysis(source: GitHubSourceData, locale: Locale): GitFolioAnalysis {
  const featureSet = extractProfileFeatures(source, profileEngineConfig);
  const scoring = scoreProfile(source, featureSet, profileEngineConfig, locale);
  return buildRuleBasedAnalysis(source, scoring, profileEngineConfig, locale);
}

function getAnalysisPayload(source: GitHubSourceData, locale: Locale) {
  return {
    account: {
      ...source.account,
      name: source.account.name ?? source.account.username,
    },
    activity: source.activity,
    pinnedRepoNames: source.pinnedRepoNames,
    representativeProjects: source.representativeRepos.map((repo) => ({
      commitMessages: repo.recentCommitMessages,
      name: repo.name,
      description: repo.description,
      homepageUrl: repo.homepageUrl,
      isPinned: repo.isPinned,
      language: repo.language,
      readmePreview: repo.readme,
      repoUrl: repo.repoUrl,
      rootFiles: repo.rootFiles,
      signal: repoSignalText(repo, locale),
      stars: repo.stars,
      techSignals: repo.techSignals,
      topics: repo.topics,
      updatedAt: repo.updatedAt,
    })),
    topLanguages: source.topLanguages,
  };
}

async function analyzeGitHubSourceInternal(
  source: GitHubSourceData,
  locale: Locale,
): Promise<AnalysisResult> {
  if (!process.env.OPENAI_API_KEY) {
    return {
      analysis: buildFallbackAnalysis(source, locale),
      mode: "fallback",
    };
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const response = await client.responses.parse({
      model: process.env.OPENAI_MODEL?.trim() || "gpt-5-mini",
      reasoning: { effort: "medium" },
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: [
                locale === "ko"
                  ? "너는 GitHub 공개 정보만으로 개발자 소개 문서를 쓰는 분석가다."
                  : "You are an analyst who writes developer profile documents using only public GitHub information.",
                locale === "ko"
                  ? "반드시 한국어로 작성하고, 없는 사실은 만들지 마라."
                  : "Write in natural English and do not invent facts that are not visible from public evidence.",
                locale === "ko"
                  ? "경력 연차, 리더십, 협업 능력, 비즈니스 성과는 공개 근거가 없으면 단정하지 마라."
                  : "Do not assert tenure, leadership, collaboration quality, or business impact unless there is public evidence.",
                locale === "ko"
                  ? "추론은 가능하지만 해석이나 추정의 어조를 유지하라."
                  : "Inference is allowed, but keep the wording interpretive and careful rather than absolute.",
                locale === "ko"
                  ? "출력은 주어진 Zod 스키마와 정확히 맞는 JSON이어야 한다."
                  : "The output must be valid JSON that matches the provided Zod schema exactly.",
                locale === "ko"
                  ? "projects는 대표 프로젝트 3~5개를 고르고, evidence는 구체적인 근거 중심으로 작성하라."
                  : "Select three to five representative projects and write evidence items around specific public signals.",
                locale === "ko"
                  ? "문장 톤은 차분하고 읽기 쉬운 전달 문서 스타일로 유지하라."
                  : "Keep the tone calm, readable, and appropriate for a shareable document.",
              ].join(" "),
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: JSON.stringify(getAnalysisPayload(source, locale)),
            },
          ],
        },
      ],
      text: {
        format: zodTextFormat(analysisSchema, "gitfolio_analysis"),
      },
    });

    const parsed = analysisSchema.parse(response.output_parsed);

    return {
      analysis: parsed,
      mode: "openai",
    };
  } catch {
    return {
      analysis: buildFallbackAnalysis(source, locale),
      mode: "fallback",
    };
  }
}

const getCachedAnalysis = unstable_cache(
  async (source: GitHubSourceData, locale: Locale) =>
    analyzeGitHubSourceInternal(source, locale),
  ["gitfolio-analysis"],
  { revalidate: ANALYSIS_CACHE_SECONDS },
);

export async function analyzeGitHubSource(
  source: GitHubSourceData,
  options?: { forceFresh?: boolean; locale?: Locale },
) {
  const locale = options?.locale ?? "ko";
  return options?.forceFresh
    ? analyzeGitHubSourceInternal(source, locale)
    : getCachedAnalysis(source, locale);
}
