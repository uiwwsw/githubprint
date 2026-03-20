import type { GitHubRepoSnapshot, GitHubSourceData } from "@/lib/github";

export type RegressionExpectation = {
  cohortId: string;
  maxConfidence?: number;
  maxPrimaryOrientationScore?: number;
  minConfidence?: number;
  minPrimaryOrientationScore?: number;
  minProjectCount?: number;
  minWorkingStyleScore?: number;
  primaryOrientation?: string;
  requiredCoreStack?: string[];
  requiredRoleIds?: string[];
  requiredSignalIds?: string[];
  requiredWorkingStyles?: string[];
};

export type RegressionCase = {
  description: string;
  expectation: RegressionExpectation;
  id: string;
  source: GitHubSourceData;
};

function isoDaysAgo(days: number) {
  const value = new Date();
  value.setUTCDate(value.getUTCDate() - days);
  return value.toISOString();
}

function buildTopLanguages(
  repos: GitHubRepoSnapshot[],
): GitHubSourceData["topLanguages"] {
  const counts = new Map<string, number>();

  repos.forEach((repo) => {
    if (!repo.language) {
      return;
    }

    counts.set(repo.language, (counts.get(repo.language) ?? 0) + 1);
  });

  const total = Math.max(repos.length, 1);

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([name, repoCount]) => ({
      name,
      repoCount,
      score: Number(((repoCount / total) * 100).toFixed(1)),
    }));
}

function makeRepo(
  overrides: Partial<GitHubRepoSnapshot> & Pick<GitHubRepoSnapshot, "name">,
): GitHubRepoSnapshot {
  const updatedAt = overrides.updatedAt ?? isoDaysAgo(10);

  return {
    archived: false,
    defaultBranch: "main",
    description: null,
    forks: 0,
    homepageUrl: "",
    isFork: false,
    isPinned: false,
    language: null,
    openIssuesCount: 0,
    pushedAt: updatedAt,
    readme: null,
    recentCommitMessages: [],
    repoUrl: `https://github.com/${overrides.name}/${overrides.name}`,
    rootFiles: [],
    score: 60,
    size: 500,
    stars: 0,
    techSignals: [],
    topics: [],
    updatedAt,
    visibility: "public",
    ...overrides,
  };
}

function buildActivityNote(recentRepoCount: number, lastActiveAt: string | null) {
  if (!lastActiveAt) {
    return "Public activity is sparse, so the recent working rhythm should be interpreted conservatively.";
  }

  if (recentRepoCount >= 5) {
    return "Several repositories were updated recently, which suggests a fairly active public working rhythm.";
  }
  if (recentRepoCount >= 2) {
    return "There are still a few recent repository updates, which suggests some ongoing iteration.";
  }

  return "Recent public repository activity is limited, so current momentum should be read conservatively.";
}

function buildEvidenceSignals(repos: GitHubRepoSnapshot[]) {
  const signals: string[] = [];

  if (repos.some((repo) => repo.homepageUrl)) {
    signals.push("At least one representative repository exposes a demo or homepage link.");
  }
  if (repos.some((repo) => (repo.readme?.length ?? 0) >= 700)) {
    signals.push("At least one representative repository has a relatively detailed README.");
  }
  if (repos.some((repo) => repo.rootFiles.includes(".github"))) {
    signals.push("Representative repositories include workflow or automation-related project structure.");
  }

  return signals;
}

function buildSource(options: {
  bio: string;
  followers?: number;
  following?: number;
  lastActiveDaysAgo?: number | null;
  name: string;
  pinnedRepoNames?: string[];
  profileUrl?: string;
  publicRepoCount?: number;
  recentRepoCount?: number;
  representativeRepos: GitHubRepoSnapshot[];
  repos?: GitHubRepoSnapshot[];
  username: string;
}) {
  const repos = options.repos ?? options.representativeRepos;
  const lastActiveAt =
    typeof options.lastActiveDaysAgo === "number"
      ? isoDaysAgo(options.lastActiveDaysAgo)
      : null;

  return {
    account: {
      avatarUrl: `https://avatars.githubusercontent.com/${options.username}`,
      bio: options.bio,
      blogUrl: null,
      company: null,
      createdAt: isoDaysAgo(800),
      email: null,
      followers: options.followers ?? 24,
      following: options.following ?? 11,
      location: "Seoul",
      name: options.name,
      profileUrl:
        options.profileUrl ?? `https://github.com/${options.username}`,
      publicGistCount: 0,
      publicRepoCount: options.publicRepoCount ?? repos.length,
      twitterUsername: null,
      type: "User" as const,
      updatedAt: isoDaysAgo(2),
      username: options.username,
    },
    activity: {
      contributionSummary: null,
      lastActiveAt,
      note: buildActivityNote(options.recentRepoCount ?? 0, lastActiveAt),
      recentRepoCount: options.recentRepoCount ?? 0,
    },
    authorizedPrivateInsights: null,
    cacheKey: `${options.username}::regression`,
    dataMode: "public" as const,
    evidenceSignals: buildEvidenceSignals(options.representativeRepos),
    pinnedRepoNames: options.pinnedRepoNames ?? [],
    privateExposureMode: "aggregate" as const,
    representativeRepos: options.representativeRepos,
    repos,
    topLanguages: buildTopLanguages(repos),
  } satisfies GitHubSourceData;
}

const frontendSource = buildSource({
  bio: "Builds polished product surfaces, prototypes, and UI systems around web products.",
  followers: 142,
  name: "Frontend Studio",
  pinnedRepoNames: ["studio-ui", "launchpad-web", "docs-showcase"],
  publicRepoCount: 18,
  recentRepoCount: 6,
  representativeRepos: [
    makeRepo({
      description:
        "A product-facing design system and app shell for fast user experience experiments.",
      homepageUrl: "https://studio-ui.example",
      isPinned: true,
      language: "TypeScript",
      name: "studio-ui",
      readme:
        "A design system and component library focused on user experience, documentation, and getting started guidance. Includes a reusable UI kit, Storybook previews, testing notes, and product-surface examples for rapid prototype work.",
      recentCommitMessages: [
        "feat: add marketing hero blocks for the prototype surface",
        "docs: expand getting started guide for the design system",
        "test: cover button and modal interactions",
        "release: ship updated component catalog",
      ],
      rootFiles: [
        "app",
        "components",
        "package.json",
        "next.config.ts",
        "tailwind.config.ts",
        ".storybook",
        "playwright.config.ts",
        ".github",
      ],
      score: 93,
      size: 3200,
      stars: 58,
      techSignals: ["TypeScript", "Next.js", "Tailwind CSS", "Storybook"],
      topics: ["react", "nextjs", "ui", "design-system"],
      updatedAt: isoDaysAgo(4),
    }),
    makeRepo({
      description:
        "A landing-page starter used to test product ideas with public demos and quick MVP loops.",
      homepageUrl: "https://launchpad.example",
      isPinned: true,
      language: "TypeScript",
      name: "launchpad-web",
      readme:
        "A prototype template for launching product pages quickly. Includes documentation, usage notes, testing guidance, and starter UI patterns for user experience experiments.",
      recentCommitMessages: [
        "feat: add starter templates for new landing variants",
        "fix: tighten CTA spacing in the public demo",
        "refactor: simplify shared marketing sections",
      ],
      rootFiles: [
        "app",
        "components",
        "package.json",
        "next.config.ts",
        "tailwind.config.ts",
        "vitest.config.ts",
        ".github",
      ],
      score: 85,
      size: 2100,
      stars: 31,
      techSignals: ["TypeScript", "React", "Tailwind CSS"],
      topics: ["react", "frontend", "prototype", "nextjs"],
      updatedAt: isoDaysAgo(11),
    }),
    makeRepo({
      description:
        "MDX-heavy documentation surface for component examples and product copy experiments.",
      isPinned: true,
      language: "MDX",
      name: "docs-showcase",
      readme:
        "Documentation and usage examples for a component library, with guide pages, UI explanations, and structured docs for previewing product decisions.",
      recentCommitMessages: [
        "docs: add usage examples for new card patterns",
        "feat: support component library snippets",
      ],
      rootFiles: ["docs", "package.json", "README.md", ".github"],
      score: 72,
      size: 880,
      stars: 12,
      techSignals: ["MDX", "documentation"],
      topics: ["docs", "component-library", "ui"],
      updatedAt: isoDaysAgo(18),
    }),
  ],
  username: "frontend-studio",
});

const backendSource = buildSource({
  bio: "Works on API surfaces, services, and operational structure for backend-heavy products.",
  followers: 67,
  name: "Backend Platform",
  pinnedRepoNames: ["ledger-api", "event-worker"],
  publicRepoCount: 22,
  recentRepoCount: 5,
  representativeRepos: [
    makeRepo({
      description:
        "A Go service for authentication, database access, webhook handling, queue processing, and internal APIs.",
      isPinned: true,
      language: "Go",
      name: "ledger-api",
      readme:
        "A backend service that exposes API endpoints, authentication flows, queue workers, database migrations, and webhook handlers. Includes getting started docs, deployment notes, and testing instructions.",
      recentCommitMessages: [
        "feat: add webhook retry queue for settlement events",
        "fix: reduce timeout failures in authentication service",
        "refactor: split database access into smaller packages",
        "test: cover API middleware and queue handlers",
        "release: deploy v0.9.0 service build",
      ],
      rootFiles: ["cmd", "internal", "go.mod", "Dockerfile", ".github", "docs"],
      score: 91,
      size: 4100,
      stars: 44,
      techSignals: ["Go", "Postgres", "Redis"],
      topics: ["backend", "api", "postgres", "redis", "server"],
      updatedAt: isoDaysAgo(6),
    }),
    makeRepo({
      description:
        "A Python worker service for queues, webhooks, and operational jobs tied to product data flows.",
      language: "Python",
      name: "event-worker",
      readme:
        "Worker processes for queue execution, service orchestration, and operational automation. Includes usage docs, testing, and deployment notes for the backend pipeline.",
      recentCommitMessages: [
        "feat: add queue retry visibility for failed jobs",
        "fix: handle duplicate webhook delivery ids",
        "test: add coverage for worker scheduling",
      ],
      rootFiles: ["src", "pyproject.toml", "Dockerfile", ".github", "docs"],
      score: 84,
      size: 2600,
      stars: 19,
      techSignals: ["Python", "queue", "service"],
      topics: ["backend", "queue", "service", "automation"],
      updatedAt: isoDaysAgo(13),
    }),
    makeRepo({
      description:
        "Operational scripts and service checks for API environments and deployment workflows.",
      language: "Shell",
      name: "ops-checks",
      readme:
        "Service checks, deployment scripts, and workflow automation for maintaining backend environments with clear documentation and usage notes.",
      recentCommitMessages: [
        "refactor: simplify deployment workflow scripts",
        "docs: add usage for service health commands",
      ],
      rootFiles: ["scripts", ".github", "docs", "Dockerfile"],
      score: 66,
      size: 740,
      stars: 9,
      techSignals: ["Shell", "operations"],
      topics: ["automation", "backend", "workflow"],
      updatedAt: isoDaysAgo(29),
    }),
  ],
  username: "backend-platform",
});

const aiSource = buildSource({
  bio: "Ships applied AI product experiments across chat, retrieval, and evaluation workflows.",
  followers: 91,
  name: "AI Product Lab",
  pinnedRepoNames: ["support-copilot", "chat-surface"],
  publicRepoCount: 16,
  recentRepoCount: 4,
  representativeRepos: [
    makeRepo({
      description:
        "An applied LLM support copilot with retrieval, embeddings, prompt orchestration, and agent behaviors.",
      homepageUrl: "https://support-copilot.example",
      isPinned: true,
      language: "Python",
      name: "support-copilot",
      readme:
        "A retrieval-augmented support copilot built with embeddings, prompt routing, agent behaviors, evaluation docs, and testing notes. Includes a guide for deploying an AI assistant into a product environment.",
      recentCommitMessages: [
        "feat: add retrieval ranking for support answers",
        "test: cover prompt evaluation scenarios",
        "release: deploy new agent workflow",
      ],
      rootFiles: ["src", "pyproject.toml", ".github", "docs"],
      score: 94,
      size: 3500,
      stars: 52,
      techSignals: ["Python", "OpenAI", "RAG"],
      topics: ["openai", "llm", "rag", "agent"],
      updatedAt: isoDaysAgo(5),
    }),
    makeRepo({
      description:
        "A chat client used to expose AI features in a lightweight public demo.",
      homepageUrl: "https://chat-surface.example",
      isPinned: true,
      language: "TypeScript",
      name: "chat-surface",
      readme:
        "A lightweight chat client for prompt and agent experiments. Includes prototype flows, setup docs, and testing guidance for AI feature delivery.",
      recentCommitMessages: [
        "feat: add agent handoff panels to the chat surface",
        "fix: stabilize prompt composer state",
        "docs: clarify setup for the AI demo",
      ],
      rootFiles: ["src", "package.json", "vite.config.ts", ".github"],
      score: 82,
      size: 2400,
      stars: 27,
      techSignals: ["TypeScript", "OpenAI", "chat"],
      topics: ["openai", "ai", "agent", "prototype"],
      updatedAt: isoDaysAgo(12),
    }),
    makeRepo({
      description:
        "Evaluation notebooks and prompt test suites for retrieval-driven LLM features.",
      language: null,
      name: "eval-lab",
      readme:
        "Evaluation docs, testing notes, and prompt experiments for retrieval and embedding systems. The repository keeps usage notes and documentation around AI quality checks.",
      recentCommitMessages: [
        "test: expand evaluation coverage for retrieval traces",
        "docs: add guide for prompt quality review",
      ],
      rootFiles: ["docs", ".github"],
      score: 70,
      size: 1180,
      stars: 11,
      techSignals: ["evaluation", "LLM"],
      topics: ["machine-learning", "llm", "rag", "evaluation"],
      updatedAt: isoDaysAgo(24),
    }),
  ],
  username: "ai-product-lab",
});

const mobileSource = buildSource({
  bio: "Builds mobile-first MVPs and app experiences with public demos and frequent iteration.",
  followers: 53,
  name: "Mobile Sprint",
  pinnedRepoNames: ["habit-mobile", "trip-companion"],
  publicRepoCount: 14,
  recentRepoCount: 3,
  representativeRepos: [
    makeRepo({
      description:
        "A Flutter mobile app with App Store and Play Store flows for habit tracking.",
      homepageUrl: "https://habit-mobile.example",
      isPinned: true,
      language: "Dart",
      name: "habit-mobile",
      readme:
        "A mobile app prototype with setup docs, app store notes, and onboarding guidance for a Flutter product MVP. Includes testing and release instructions.",
      recentCommitMessages: [
        "feat: add onboarding and streak widgets to the mobile app",
        "fix: resolve navigation bug on Android tablets",
        "release: prepare play store beta build",
      ],
      rootFiles: ["lib", "ios", "android", ".github", "docs"],
      score: 90,
      size: 3000,
      stars: 35,
      techSignals: ["Dart", "Flutter"],
      topics: ["flutter", "mobile", "android", "ios"],
      updatedAt: isoDaysAgo(7),
    }),
    makeRepo({
      description:
        "A travel planning app experiment built for quick mobile product tests.",
      homepageUrl: "https://trip-companion.example",
      isPinned: true,
      language: "Dart",
      name: "trip-companion",
      readme:
        "A mobile app starter for travel planning prototypes, with usage docs, guide sections, and release notes for rapid MVP work.",
      recentCommitMessages: [
        "feat: add itinerary cards for mobile app planning",
        "docs: expand getting started guide for the app",
      ],
      rootFiles: ["lib", "ios", "android", ".github"],
      score: 80,
      size: 2250,
      stars: 17,
      techSignals: ["Dart", "Flutter"],
      topics: ["flutter", "mobile", "prototype"],
      updatedAt: isoDaysAgo(15),
    }),
    makeRepo({
      description:
        "A smaller iOS utility experiment used to validate focused app workflows.",
      language: "Swift",
      name: "focus-widget",
      readme:
        "A compact iOS app experiment with setup notes, usage docs, and widget behavior explanations.",
      recentCommitMessages: [
        "fix: stabilize widget refresh timing on iOS",
        "docs: add usage guide for widget setup",
      ],
      rootFiles: ["ios", ".github", "docs"],
      score: 68,
      size: 940,
      stars: 8,
      techSignals: ["Swift", "iOS"],
      topics: ["ios", "mobile"],
      updatedAt: isoDaysAgo(27),
    }),
  ],
  username: "mobile-sprint",
});

const devtoolsSource = buildSource({
  bio: "Focuses on CLI tooling, workflow automation, and improving developer ergonomics.",
  followers: 76,
  name: "Toolsmith",
  pinnedRepoNames: ["repo-lint", "task-runner", "shell-bootstrap"],
  publicRepoCount: 19,
  recentRepoCount: 5,
  representativeRepos: [
    makeRepo({
      description:
        "A Rust CLI for repository linting, workflow checks, and compiler-style diagnostics.",
      isPinned: true,
      language: "Rust",
      name: "repo-lint",
      readme:
        "Developer tooling for CLI-based repository checks, workflow automation, plugin hooks, documentation, and testing. Focused on improving developer workflow quality.",
      recentCommitMessages: [
        "feat: add new compiler-style diagnostics for config drift",
        "test: expand CLI coverage for workflow checks",
        "refactor: simplify plugin execution pipeline",
        "release: cut repo-lint 0.7.0",
      ],
      rootFiles: ["src", "Cargo.toml", ".github", "docs"],
      score: 92,
      size: 2850,
      stars: 41,
      techSignals: ["Rust", "CLI"],
      topics: ["cli", "tooling", "automation", "compiler"],
      updatedAt: isoDaysAgo(4),
    }),
    makeRepo({
      description:
        "A Rust automation runner used to streamline local task orchestration and developer workflow setup.",
      isPinned: true,
      language: "Rust",
      name: "task-runner",
      readme:
        "A CLI and automation workflow tool with documentation, getting started guidance, testing notes, and developer tooling examples.",
      recentCommitMessages: [
        "feat: add workflow macros for local developer tasks",
        "docs: expand usage guide for CLI automation",
        "test: cover task graph execution",
      ],
      rootFiles: ["src", "Cargo.toml", ".github", "docs"],
      score: 83,
      size: 1980,
      stars: 22,
      techSignals: ["Rust", "automation"],
      topics: ["cli", "tooling", "automation", "plugin"],
      updatedAt: isoDaysAgo(13),
    }),
    makeRepo({
      description:
        "Shell bootstrap scripts and developer environment helpers for repeatable setup.",
      isPinned: true,
      language: "Shell",
      name: "shell-bootstrap",
      readme:
        "Workflow automation and developer tooling scripts for repeatable setup, plugin configuration, and documentation.",
      recentCommitMessages: [
        "refactor: simplify bootstrap workflow scripts",
        "docs: add plugin configuration guide",
      ],
      rootFiles: ["scripts", ".github", "docs"],
      score: 69,
      size: 620,
      stars: 7,
      techSignals: ["Shell", "workflow"],
      topics: ["automation", "plugin", "workflow", "tooling"],
      updatedAt: isoDaysAgo(22),
    }),
  ],
  username: "toolsmith",
});

const generalistSource = buildSource({
  bio: "Keeps a few small experiments public, but the visible profile surface is still fairly light.",
  followers: 7,
  lastActiveDaysAgo: 420,
  name: "Generalist Sketches",
  publicRepoCount: 3,
  recentRepoCount: 0,
  representativeRepos: [
    makeRepo({
      description: "Small browser notes experiment.",
      language: null,
      name: "toy-notes",
      readme: "A small notes experiment.",
      recentCommitMessages: ["fix: typo"],
      rootFiles: ["README.md"],
      score: 36,
      size: 150,
      stars: 0,
      techSignals: [],
      topics: [],
      updatedAt: isoDaysAgo(420),
    }),
    makeRepo({
      description: "Simple data parsing script.",
      language: null,
      name: "small-script",
      readme: "A script for parsing files.",
      recentCommitMessages: ["docs: note sample usage"],
      rootFiles: ["README.md"],
      score: 28,
      size: 120,
      stars: 0,
      techSignals: [],
      topics: [],
      updatedAt: isoDaysAgo(560),
    }),
  ],
  username: "generalist-sketches",
});

const manifestDrivenFrontendSource = buildSource({
  bio: "Builds lightweight product surfaces and frontend experiments around fast web iteration.",
  followers: 18,
  name: "Manifest Driven UI",
  publicRepoCount: 5,
  recentRepoCount: 1,
  representativeRepos: [
    makeRepo({
      description:
        "A lightweight web app shell used to validate product ideas without much extra repository metadata.",
      isPinned: true,
      language: "TypeScript",
      manifestContents: [
        JSON.stringify({
          dependencies: {
            next: "16.0.0",
            react: "19.0.0",
            tailwindcss: "4.0.0",
          },
        }),
      ],
      name: "manifest-web",
      readme: "A small product-facing web experiment.",
      recentCommitMessages: [
        "feat: ship initial app shell",
        "fix: polish landing copy",
      ],
      rootFiles: ["app", "components", "package.json", "tsconfig.json", ".github"],
      score: 71,
      size: 980,
      stars: 5,
      techSignals: ["TypeScript"],
      topics: ["react", "frontend"],
      updatedAt: isoDaysAgo(20),
    }),
  ],
  username: "manifest-driven-ui",
});

export const regressionCases: RegressionCase[] = [
  {
    description: "Frontend-heavy product and design-system work should read as frontend with visible prototyping and shipping signals.",
    expectation: {
      cohortId: "frontend",
      minConfidence: 70,
      minPrimaryOrientationScore: 70,
      minProjectCount: 3,
      minWorkingStyleScore: 45,
      primaryOrientation: "frontend",
      requiredRoleIds: ["role:frontend-product", "role:frontend-prototype"],
      requiredSignalIds: [
        "topic:react",
        "file:next-config",
        "meta:multiple-demos",
      ],
      requiredCoreStack: ["Next.js", "TypeScript"],
      requiredWorkingStyles: ["prototyping", "shipping", "documentation"],
    },
    id: "frontend-product",
    source: frontendSource,
  },
  {
    description: "Backend services with infra files and workflow structure should read as backend with strong structural signals.",
    expectation: {
      cohortId: "backend",
      minConfidence: 68,
      minPrimaryOrientationScore: 70,
      minProjectCount: 3,
      minWorkingStyleScore: 45,
      primaryOrientation: "backend",
      requiredRoleIds: ["role:backend-product", "role:backend-platform"],
      requiredSignalIds: [
        "topic:backend",
        "file:go-mod",
        "file:docker",
      ],
      requiredCoreStack: ["Go", "Python"],
      requiredWorkingStyles: ["structure", "iteration", "quality"],
    },
    id: "backend-platform",
    source: backendSource,
  },
  {
    description: "Applied AI projects should resolve to the AI cohort without losing visible product-delivery signals.",
    expectation: {
      cohortId: "ai",
      minConfidence: 65,
      minPrimaryOrientationScore: 65,
      minProjectCount: 3,
      minWorkingStyleScore: 40,
      primaryOrientation: "ai",
      requiredRoleIds: ["role:ai-product"],
      requiredSignalIds: [
        "topic:ai",
        "keyword:ai-domain",
        "file:python-manifest",
      ],
      requiredCoreStack: ["Python", "AI"],
      requiredWorkingStyles: ["prototyping", "shipping", "quality"],
    },
    id: "ai-application",
    source: aiSource,
  },
  {
    description: "Mobile-first repos with iOS/Android surfaces should read as mobile and support product-style delivery signals.",
    expectation: {
      cohortId: "mobile",
      minConfidence: 60,
      minPrimaryOrientationScore: 70,
      minProjectCount: 3,
      minWorkingStyleScore: 35,
      primaryOrientation: "mobile",
      requiredRoleIds: ["role:mobile-product"],
      requiredSignalIds: [
        "topic:mobile",
        "file:mobile-dir",
        "meta:has-demo",
      ],
      requiredCoreStack: ["Flutter", "Dart"],
      requiredWorkingStyles: ["prototyping", "shipping"],
    },
    id: "mobile-product",
    source: mobileSource,
  },
  {
    description: "CLI and automation-heavy repositories should resolve to devtools with structure and quality signals.",
    expectation: {
      cohortId: "devtools",
      minConfidence: 68,
      minPrimaryOrientationScore: 70,
      minProjectCount: 3,
      minWorkingStyleScore: 45,
      primaryOrientation: "devtools",
      requiredRoleIds: ["role:devtools"],
      requiredSignalIds: [
        "topic:devtools",
        "keyword:tooling",
        "file:cargo",
      ],
      requiredCoreStack: ["Rust"],
      requiredWorkingStyles: ["structure", "quality", "documentation"],
    },
    id: "devtools-toolsmith",
    source: devtoolsSource,
  },
  {
    description: "Manifest dependency strings alone should be enough to surface Next.js-based frontend stack signals.",
    expectation: {
      cohortId: "frontend",
      minConfidence: 45,
      minPrimaryOrientationScore: 45,
      minProjectCount: 1,
      primaryOrientation: "frontend",
      requiredCoreStack: ["Next.js", "TypeScript"],
      requiredSignalIds: ["topic:react", "file:package-json", "file:app-dir"],
    },
    id: "manifest-driven-frontend",
    source: manifestDrivenFrontendSource,
  },
  {
    description: "Sparse mixed-signal repositories should stay conservative and land in the generalist cohort.",
    expectation: {
      cohortId: "generalist",
      maxConfidence: 60,
      maxPrimaryOrientationScore: 44,
      minProjectCount: 2,
    },
    id: "generalist-light-signal",
    source: generalistSource,
  },
];
