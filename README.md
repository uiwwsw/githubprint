<div align="center">
  <h1>GitFolio</h1>
  <p><strong>Turn a public GitHub profile into a shareable, PDF-ready developer document.</strong></p>
  <p>공개 GitHub 프로필을 공유 가능한 PDF형 개발자 문서로 정리합니다.</p>
  <p>
    <a href="https://gitfolio-seven.vercel.app">Live</a>
    ·
    <a href="#english">English</a>
    ·
    <a href="#한국어">한국어</a>
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
    <img alt="Locale" src="https://img.shields.io/badge/Locale-KO%20%2F%20EN-555555" />
  </p>
</div>

## English

### Overview

GitFolio turns public GitHub evidence into a readable developer document for sharing with recruiters, collaborators, or clients.

- Input: GitHub profile URL, repository URL, or username
- Output: a print-ready web document optimized for A4 and browser PDF export
- Templates: `brief`, `profile`, `insight`
- Analysis: OpenAI when available, schema-validated fallback otherwise
- Locales: Korean and English routes (`/`, `/result`, `/en`, `/en/result`)

### Scope

GitFolio uses only public GitHub information:

- profile metadata
- public repositories
- README content
- topics, stars, update history, and homepage links
- selected root files and recent commit messages

GitFolio does not assert:

- career tenure
- leadership
- collaboration quality
- business impact
- anything not visible from public GitHub evidence

Current product limits:

- individual developer accounts only; organization accounts are not supported
- result pages are query-driven and intentionally not indexed
- local development is more reliable with `GITHUB_TOKEN`

### Features

- Three document templates rendered from the same analysis data
- Cohort benchmark snapshot for activity, documentation, publication, quality, portfolio clarity, and specialization clarity
- Server-side GitHub URL normalization and public data collection
- AI analysis with a deterministic fallback path
- Print-friendly result pages with browser PDF export
- Fixture mode for UI work without external API calls

## 한국어

### 개요

GitFolio는 공개 GitHub 정보를 바탕으로 채용 담당자, 협업자, 클라이언트에게 전달할 수 있는 개발자 문서를 만듭니다.

- 입력: GitHub 프로필 URL, 저장소 URL, 또는 사용자 이름(username)
- 출력: A4 인쇄와 브라우저 PDF 저장에 맞춘 문서형 결과
- 템플릿: `brief`, `profile`, `insight`
- 분석: OpenAI 사용 가능 시 AI 분석, 불가 시 규칙 기반 대체 분석
- 언어 경로: `/`, `/result`, `/en`, `/en/result`

### 범위

GitFolio는 공개 GitHub 정보만 사용합니다:

- 프로필 메타데이터
- 공개 저장소
- README 내용
- topic, star 수, 최근 업데이트, 홈페이지 링크
- 일부 루트 파일과 최근 커밋 메시지

GitFolio는 다음 항목을 단정하지 않습니다:

- 경력 연차
- 리더십
- 협업 능력
- 비즈니스 성과
- 공개 GitHub 근거로 확인할 수 없는 내용

현재 제품 제약:

- 개인 개발자 계정만 지원하며, 조직 계정은 지원하지 않습니다
- 결과 페이지는 쿼리 기반 경로이며 검색 인덱싱 대상이 아닙니다
- 로컬 개발은 `GITHUB_TOKEN`이 있을 때 더 안정적입니다

### 주요 기능

- 같은 분석 데이터를 세 가지 문서 템플릿으로 렌더링
- 활동성, 문서화, 외부 공개, 검증 흔적, 포트폴리오 선명도, 전문성 선명도를 보여주는 벤치마크 스냅샷
- 서버 측 GitHub URL 정규화 및 공개 데이터 수집
- AI 분석과 규칙 기반 fallback 경로
- 인쇄 친화 결과 페이지와 브라우저 PDF 저장
- 외부 API 없이 UI 작업이 가능한 fixture mode

## Architecture

| Path | Responsibility |
| --- | --- |
| `app/page.tsx` / `app/en/page.tsx` | Localized home routes |
| `app/result/page.tsx` / `app/en/result/page.tsx` | Localized result routes |
| `components/templates/` | Document templates for `brief`, `profile`, and `insight` |
| `lib/github.ts` | GitHub collection, caching, fixture mode, and representative repository selection |
| `lib/analyze.ts` | AI analysis and fallback orchestration |
| `lib/profile-features.ts` | Feature extraction from raw GitHub source data |
| `data/signals/` | Signal definitions for languages, topics, files, and commit patterns |
| `data/rules/` | Scoring rules for orientation, working style, strengths, and role fit |
| `lib/benchmark.ts` | Cohort benchmark comparison |
| `lib/seo.ts` | Canonical metadata, alternates, sitemap, and robots rules |

## Tech Stack

- Next.js 16 App Router
- TypeScript
- Tailwind CSS v4
- OpenAI Responses API
- GitHub REST API + GraphQL
- Zod

## Local Development

### Requirements

- Node.js `20.9+`
- npm `10+`

### Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Production is available at [gitfolio-seven.vercel.app](https://gitfolio-seven.vercel.app).

### Environment Variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `GITHUB_TOKEN` | Recommended | Raises GitHub API limits and improves local reliability |
| `OPENAI_API_KEY` | Optional | Enables AI analysis; fallback still works without it |
| `OPENAI_MODEL` | Optional | Overrides the default model, currently `gpt-5-mini` |
| `NEXT_PUBLIC_SITE_URL` | Optional | Canonical origin for metadata and Open Graph tags |
| `GITFOLIO_USE_FIXTURE` | Optional | Enables local fixture mode for UI work |
| `GITFOLIO_CAPTURE_INSIGHTS` | Optional | Captures internal scoring snapshots for tuning |
| `GITFOLIO_BENCHMARK_OVERRIDE_PATH` | Optional | Loads an aggregated benchmark JSON during local testing |

### Local GitHub Rate Limits

When you run without `GITHUB_TOKEN`, GitFolio:

- reduces GitHub fetch depth
- reuses the last successful local source from `.cache/`
- falls back to a minimal local document when no cache is available and GitHub is already rate-limited

### Fixture Mode

For UI work without external API calls:

```bash
GITFOLIO_USE_FIXTURE=1 npm run dev
```

Fixture mode is development-only.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Next.js development server |
| `npm run build` | Create a production build |
| `npm run start` | Start the production server |
| `npm run typecheck` | Run TypeScript checks |
| `npm run check` | Run build, typecheck, and quality regressions |
| `npm run quality:regress` | Run fixture-based quality regressions |
| `npm run insights:aggregate` | Aggregate captured internal insight snapshots |

## Verification

Before shipping or opening a PR:

```bash
npm run check
```

`npm run check` runs:

- production build
- TypeScript checks
- fixture-based quality regressions

Regression reports are written to `.cache/gitfolio/reports/`.

## Additional Docs

- [Contributing](./CONTRIBUTING.md)
- [Learning Loop](./docs/learning-loop.md)
