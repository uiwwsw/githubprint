<div align="center">
  <h1>GitFolio</h1>
  <p><strong>Turn a public GitHub URL into a shareable, PDF-ready developer brief.</strong></p>
  <p>공개 GitHub URL을 읽기 쉬운 A4 문서 형태의 개발자 소개 자료로 바꾸는 bilingual web app.</p>
  <p>
    <a href="https://gitfolio-seven.vercel.app">Live</a>
    ·
    <a href="./CONTRIBUTING.md">Contributing</a>
    ·
    <a href="./docs/learning-loop.md">Learning Loop</a>
  </p>
  <p>
    <img alt="Next.js" src="https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs" />
    <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white" />
    <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white" />
    <img alt="OpenAI" src="https://img.shields.io/badge/OpenAI-optional-111111" />
    <img alt="GitHub API" src="https://img.shields.io/badge/GitHub_API-public_data-181717?logo=github" />
    <img alt="Bilingual" src="https://img.shields.io/badge/Locale-KO%20%2F%20EN-555555" />
  </p>
</div>

## GitFolio, Clearly

GitFolio is a focused product.  
It is not a dashboard, not a recruiting platform, and not a social profile builder.

GitFolio takes one public GitHub URL and turns it into one shareable document.

- Input: a GitHub profile URL, repository URL, or username
- Choice: one of three document templates
- Output: a readable web document that is optimized for A4 print and browser PDF export

핵심은 단순합니다.

- 입력: GitHub URL 또는 username
- 선택: 템플릿 1개
- 결과: 전달 가능한 문서 1개

## Status

> **Current stage: early v1 beta**  
> **현재 단계: early v1 beta**

GitFolio is past the “raw prototype” stage, but it is still deliberately narrow in scope.
The current focus is not feature breadth. It is document quality, interpretation clarity, and a stable product loop.

지금 GitFolio는 “대충 만든 MVP” 단계는 지났지만, 범위를 의도적으로 좁힌 상태입니다.
현재 초점은 기능 수가 아니라 문서 품질, 해석의 명확성, 그리고 안정적인 개선 루프입니다.

## What It Is

- A two-page app with one clear job
- A document-first interface instead of a metrics dashboard
- A bilingual product with Korean and English routes
- A GitHub-to-document pipeline with AI analysis plus deterministic fallback

## What It Is Not

- Not auth-heavy
- Not database-centric
- Not a multi-step wizard
- Not a profile editor
- Not a broad GitHub analytics suite

## What You Get

The same underlying analysis is rendered through three templates:

| Template | Use | Tone |
| --- | --- | --- |
| `brief` | Short, compressed summary | Resume-adjacent |
| `profile` | Balanced default document | General-purpose |
| `insight` | Interpretation-heavy report | More analytical |

GitFolio now also ships a **peer benchmark snapshot** on top of the document itself.

- Which cohort does this profile most resemble?
- How strong are activity, documentation, shipping, quality, and portfolio clarity signals inside that cohort?
- How confident is the current reading?

## Product Flow

1. Enter a GitHub URL or username.
2. Choose a template.
3. Generate the result.
4. Read it in-browser.
5. Save it as PDF through the browser print flow.

Public routes are intentionally small:

- Korean home: `/`
- Korean result: `/result`
- English home: `/en`
- English result: `/en/result`

## What GitFolio Actually Tries To Say

The goal is not to overclaim.  
The goal is to produce a calm, readable summary of what is visible from public GitHub evidence.

GitFolio tries to answer:

- What kind of developer does this profile look like?
- What do they seem to build repeatedly?
- Which technologies show up most often?
- What working style is visible from repositories, docs, files, and activity?
- Which roles look like a reasonable fit?

GitFolio does **not** try to assert:

- career tenure
- leadership
- collaboration quality
- business impact
- anything that is not visible from public GitHub evidence

## How It Works

At a high level:

1. Normalize the GitHub input on the server.
2. Fetch public profile and repository data.
3. Select representative repositories.
4. Analyze the data with OpenAI when available.
5. Fall back to a deterministic profiling engine when AI is unavailable or rejected.
6. Render a print-optimized document.

## Data-Driven Profiling Engine

The fallback analysis is intentionally not buried in a single hardcoded function anymore.

It follows this structure:

1. [`/Users/uiwwsw/gitfolio/lib/github.ts`](/Users/uiwwsw/gitfolio/lib/github.ts) collects GitHub profile, repo, README, root file, and recent commit signals
2. [`/Users/uiwwsw/gitfolio/lib/profile-features.ts`](/Users/uiwwsw/gitfolio/lib/profile-features.ts) converts raw GitHub data into normalized feature matches
3. [`/Users/uiwwsw/gitfolio/data/signals/`](/Users/uiwwsw/gitfolio/data/signals) defines which languages, topics, files, keywords, and commit patterns matter
4. [`/Users/uiwwsw/gitfolio/data/rules/`](/Users/uiwwsw/gitfolio/data/rules) defines scoring rules for developer orientation, working style, strengths, and role fit
5. [`/Users/uiwwsw/gitfolio/data/templates/narratives.json`](/Users/uiwwsw/gitfolio/data/templates/narratives.json) defines the shareable narrative bands
6. [`/Users/uiwwsw/gitfolio/lib/narrative-writer.ts`](/Users/uiwwsw/gitfolio/lib/narrative-writer.ts) turns those scores into the final JSON document

If you want to tune interpretation, prefer editing `data/*.json` before rewriting TypeScript logic.

## Cohort Benchmark Layer

GitFolio now includes a cohort-based benchmark layer in addition to the descriptive document.

- determine the closest visible cohort
- score benchmark metrics inside that cohort
- estimate percentile-style placement
- expose a confidence score for how stable the current reading is

This is intentionally **not** an “overall developer rank.”
It is closer to: “how this public GitHub profile reads relative to a similar public cohort.”

Baseline cohort distributions live in [`/Users/uiwwsw/gitfolio/data/benchmarks/cohorts.json`](/Users/uiwwsw/gitfolio/data/benchmarks/cohorts.json), and the runtime comparator lives in [`/Users/uiwwsw/gitfolio/lib/benchmark.ts`](/Users/uiwwsw/gitfolio/lib/benchmark.ts).

## Internal Insight Capture

If GitFolio is meant to improve as more profiles are analyzed, it needs a machine-readable learning layer, not just prettier copy.

That foundation now exists:

- [`/Users/uiwwsw/gitfolio/lib/internal-insights.ts`](/Users/uiwwsw/gitfolio/lib/internal-insights.ts) builds compact internal learning snapshots
- `GITFOLIO_CAPTURE_INSIGHTS=1` stores those snapshots for internal tuning
- each snapshot carries cohort, benchmark, matched signals, representative-repo shape, and scoring vectors

This makes it possible to evolve from rule-only interpretation toward a stronger internal benchmark service over time.

The collaborator-facing process is documented in [`/Users/uiwwsw/gitfolio/docs/learning-loop.md`](/Users/uiwwsw/gitfolio/docs/learning-loop.md).

## Architecture Snapshot

| Path | Responsibility |
| --- | --- |
| [`/Users/uiwwsw/gitfolio/app/page.tsx`](/Users/uiwwsw/gitfolio/app/page.tsx) | Korean home route |
| [`/Users/uiwwsw/gitfolio/app/en/page.tsx`](/Users/uiwwsw/gitfolio/app/en/page.tsx) | English home route |
| [`/Users/uiwwsw/gitfolio/app/result/page.tsx`](/Users/uiwwsw/gitfolio/app/result/page.tsx) | Korean result route |
| [`/Users/uiwwsw/gitfolio/app/en/result/page.tsx`](/Users/uiwwsw/gitfolio/app/en/result/page.tsx) | English result route |
| [`/Users/uiwwsw/gitfolio/components/pages/home-page-content.tsx`](/Users/uiwwsw/gitfolio/components/pages/home-page-content.tsx) | Shared landing UI |
| [`/Users/uiwwsw/gitfolio/components/pages/result-page-content.tsx`](/Users/uiwwsw/gitfolio/components/pages/result-page-content.tsx) | Shared result flow |
| [`/Users/uiwwsw/gitfolio/lib/analyze.ts`](/Users/uiwwsw/gitfolio/lib/analyze.ts) | AI analysis + deterministic fallback entry |
| [`/Users/uiwwsw/gitfolio/lib/schemas.ts`](/Users/uiwwsw/gitfolio/lib/schemas.ts) | Zod schemas for routes and analysis output |
| [`/Users/uiwwsw/gitfolio/lib/seo.ts`](/Users/uiwwsw/gitfolio/lib/seo.ts) | Metadata, canonical, alternate languages |
| [`/Users/uiwwsw/gitfolio/proxy.ts`](/Users/uiwwsw/gitfolio/proxy.ts) | Path-based locale redirect handling |

## SEO and Internationalization

Home pages are indexable and localized.

- Korean canonical: `/`
- English canonical: `/en`
- alternate language metadata is included
- `robots.txt` and `sitemap.xml` are provided

Result pages are intentionally not indexed.

- `noindex, nofollow`
- query-driven by design
- not intended as search landing pages

## Tech Stack

- Next.js 16 App Router
- TypeScript
- Tailwind CSS v4
- OpenAI Responses API
- GitHub REST + GraphQL
- Zod

## Local Development

### Prerequisites

- Node.js `20.9+`
- npm `10+`

### Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open:

```text
http://localhost:3000
```

Production:

```text
https://gitfolio-seven.vercel.app
```

### Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `GITHUB_TOKEN` | Recommended | Raises GitHub API limits and improves local reliability |
| `OPENAI_API_KEY` | Optional | Enables AI analysis; deterministic fallback still works without it |
| `OPENAI_MODEL` | No | Overrides the default model, currently `gpt-5-mini` |
| `NEXT_PUBLIC_SITE_URL` | No | Canonical origin, defaults to `https://gitfolio-seven.vercel.app` |
| `GITFOLIO_USE_FIXTURE` | No | Explicitly enables local fixture mode |
| `GITFOLIO_CAPTURE_INSIGHTS` | No | Stores internal benchmark/scoring snapshots for future tuning |
| `GITFOLIO_BENCHMARK_OVERRIDE_PATH` | No | Optional runtime path for testing aggregated benchmark files |

### Local Rate Limit Behavior

If you run locally without `GITHUB_TOKEN`, GitFolio does three things:

- reduces GitHub fetch depth
- reuses the last successful local GitHub source from `.cache/`
- if GitHub is already rate-limited and no local cache exists yet, renders a minimal local fallback document instead of crashing

This keeps local iteration moving, but real testing quality is still much better with `GITHUB_TOKEN`.

### Fixture Mode

For UI-only work without external API calls:

```bash
GITFOLIO_USE_FIXTURE=1 npm run dev
```

Fixture mode is development-only. Production paths must not use fake data.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the local Next.js dev server |
| `npm run build` | Create a production build |
| `npm run start` | Run the production server |
| `npm run typecheck` | Run TypeScript checks |
| `npm run check` | Run typecheck and production build |
| `npm run insights:aggregate` | Aggregate captured internal insight snapshots into reports and derived benchmarks |

## Verification

Before shipping or opening a PR:

```bash
npm run check
```

## Collaboration Notes

If you contribute to GitFolio, keep these rules intact:

- preserve the two-page product surface
- do not casually add auth, dashboards, or persistence-heavy flows
- keep secrets server-only
- keep result pages printable and PDF-friendly
- keep AI output schema-first and Zod-validated
- keep deterministic fallback usable when AI fails
- do not invent facts beyond public GitHub evidence
- prefer adjusting `data/*.json` rules before hardcoding new interpretation logic

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the collaborator workflow.

## Korean Summary

GitFolio는 “GitHub를 문서로 바꾸는 앱”입니다.  
분석 대시보드가 아니라, 채용 담당자나 협업자에게 전달할 수 있는 결과물을 만드는 데 초점을 둡니다.

현재 단계는 기능을 최소한으로 유지한 **제품형 MVP**입니다.

- 입력 페이지 1개
- 결과 페이지 1개
- 템플릿 3개
- 동일한 분석 데이터 모델
- 동일 성향 집단 기준 benchmark snapshot
- confidence score
- A4 출력 / 브라우저 PDF 저장 최적화
- GitHub 공개 정보 기반
- AI 실패 시 deterministic fallback 유지

즉, “기능이 덜 붙은 실험작”보다는 “전달력과 해석 품질에 집중한 early v1 beta”에 더 가깝습니다.
