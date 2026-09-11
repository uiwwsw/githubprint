<div align="center">
  <h1>GitHubPrint</h1>
  <p><strong>Turn GitHub into a considered document — PDF, Word, or HTML.</strong></p>
  <p>GitHub 기록을 목적에 맞는 개발자 문서로 정리하고 PDF, Word, HTML로 전달합니다.</p>
  <p>
    <a href="https://githubprint.vercel.app">Live</a>
    ·
    <a href="#english">English</a>
    ·
    <a href="#한국어">한국어</a>
    ·
    <a href="./CONTRIBUTING.md">Contributing</a>
    ·
    <a href="./docs/learning-loop.md">Learning Loop</a>
    ·
    <a href="./docs/resume-template.md">Resume Template</a>
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

GitHubPrint turns GitHub evidence into a readable developer document for sharing with recruiters, collaborators, or clients.

- Input: GitHub profile URL, repository URL, or username
- Output: A4 PDF for delivery, editable Word for revision, and offline HTML for reading
- Templates: `brief`, `profile`, `insight`, `resume`
- Analysis: OpenAI when available, schema-validated fallback otherwise
- Locales: Korean and English routes (`/`, `/result`, `/en`, `/en/result`)

Each template serves a different reading task: Brief introduces two selected projects, Profile puts project case studies first, Insight separates observed patterns from comparison metrics, and Resume preserves authored experience and section order. PDF, offline HTML, and editable Word capture the selected template's layout, typography, and colors. Word pagination can vary with the editor's font metrics.

Automatic introductions cite the repositories and technologies behind each description. A specialty needs supporting implementation signals in at least two distinct, non-fork repositories; topic labels or popularity alone are insufficient. Work-pattern descriptions refer to actual README, project-link, test, or workspace evidence. Both AI and fallback output preserve these grounded identity fields, while authored Resume text remains under the author's control. Wording and evidence thresholds live in `data/templates/introductions.json`.

### Scope

GitHubPrint defaults to public GitHub information:

- profile metadata
- public repositories
- README content
- topics, stars, update history, and homepage links
- selected root files and recent commit messages

GitHubPrint does not assert:

- career tenure
- leadership
- collaboration quality
- business impact
- anything not visible from public GitHub evidence

Current product limits:

- individual developer accounts only; organization accounts are not supported
- result pages are query-driven and intentionally not indexed
- local development is more reliable with `GITHUB_TOKEN`
- signed-in self mode applies only when the logged-in user generates their own profile

### Features

- Three inference templates plus one `resume` repo-driven template
- Cohort benchmark snapshot for activity, documentation, publication, quality, portfolio clarity, and specialization clarity
- Server-side GitHub URL normalization and public data collection
- AI analysis with a deterministic fallback path
- Print-friendly result pages with browser PDF export
- Editable Word / Google Docs-compatible `.docx` exports for all four templates, with embedded Korean fonts
- Responsive, offline HTML files preserving the template markup, fonts, photos, cards, and A4 print styles
- A purpose-based save dialog, document navigation, and link copying for explicitly public examples/showcases
- Public example previews at `/preview` and `/en/preview` without sign-in
- A starter `resume` repository guide with photo support in [`docs/resume-template.md`](./docs/resume-template.md)
- Fixture mode for UI work without external API calls

## 한국어

### 개요

GitHubPrint는 공개 GitHub 정보, 또는 로그인한 본인 계정의 승인된 GitHub 데이터를 바탕으로 채용 담당자, 협업자, 클라이언트에게 전달할 수 있는 개발자 문서를 만듭니다.

- 입력: GitHub 프로필 URL, 저장소 URL, 또는 사용자 이름(username)
- 출력: 제출용 A4 PDF, 편집용 Word, 오프라인 읽기용 HTML
- 템플릿: `brief`, `profile`, `insight`, `resume`
- 분석: OpenAI 사용 가능 시 AI 분석, 불가 시 규칙 기반 대체 분석
- 언어 경로: `/`, `/result`, `/en`, `/en/result`

### 범위

GitHubPrint는 기본적으로 공개 GitHub 정보를 사용합니다:

- 프로필 메타데이터
- 공개 저장소
- README 내용
- topic, star 수, 최근 업데이트, 홈페이지 링크
- 일부 루트 파일과 최근 커밋 메시지

GitHubPrint는 다음 항목을 단정하지 않습니다:

- 경력 연차
- 리더십
- 협업 능력
- 비즈니스 성과
- 공개 GitHub 근거로 확인할 수 없는 내용

현재 제품 제약:

- 개인 개발자 계정만 지원하며, 조직 계정은 지원하지 않습니다
- 결과 페이지는 쿼리 기반 경로이며 검색 인덱싱 대상이 아닙니다
- 로컬 개발은 `GITHUB_TOKEN`이 있을 때 더 안정적입니다
- signed-in self mode는 로그인한 사용자가 본인 프로필을 생성할 때만 적용됩니다

### 주요 기능

- 같은 분석 데이터를 쓰는 세 가지 추론형 템플릿과, `resume` 레포 기반 이력서 템플릿 제공
- 활동성, 문서화, 외부 공개, 검증 흔적, 포트폴리오 선명도, 전문성 선명도를 보여주는 벤치마크 스냅샷
- 서버 측 GitHub URL 정규화 및 공개 데이터 수집
- AI 분석과 규칙 기반 fallback 경로
- 인쇄 친화 결과 페이지와 브라우저 PDF 저장
- 모든 템플릿의 편집 가능한 Word / Google Docs 호환 `.docx` 내보내기와 한글 글꼴 포함
- 템플릿의 글꼴·사진·카드·모바일 및 인쇄 레이아웃을 보존하는 오프라인 HTML 내보내기
- 용도별 저장 메뉴, 문서 목차 탐색, 공개 사례와 예시 문서의 링크 복사
- 로그인 없이 사용하는 `/preview`, `/en/preview` 예시 문서
- 사진 필드까지 포함한 `resume` starter 가이드를 [`docs/resume-template.md`](./docs/resume-template.md)로 제공
- 외부 API 없이 UI 작업이 가능한 fixture mode

## Architecture

| Path                                             | Responsibility                                                                    |
| ------------------------------------------------ | --------------------------------------------------------------------------------- |
| `app/page.tsx` / `app/en/page.tsx`               | Localized home routes                                                             |
| `app/result/page.tsx` / `app/en/result/page.tsx` | Localized result routes                                                           |
| `components/templates/`                          | Document templates for `brief`, `profile`, `insight`, and `resume`                |
| `lib/resume.ts` / `lib/resume-source.ts`         | Resume schema parsing, normalization, and GitHub-backed activation checks         |
| `lib/github.ts`                                  | GitHub collection, caching, fixture mode, and representative repository selection |
| `lib/repo-identity.ts`                           | Contributor-editable repository identity inference driven by JSON rules           |
| `lib/analyze.ts`                                 | AI analysis and fallback orchestration                                            |
| `lib/profile-features.ts`                        | Feature extraction from raw GitHub source data                                    |
| `data/signals/`                                  | Signal definitions for languages, topics, files, and commit patterns              |
| `data/repo-identity/`                            | JSON rules for contributor-editable stack, framework, and project-type inference  |
| `data/rules/`                                    | Scoring rules for orientation, working style, strengths, and role fit             |
| `lib/benchmark.ts`                               | Cohort benchmark comparison                                                       |
| `lib/seo.ts`                                     | Canonical metadata, alternates, sitemap, and robots rules                         |

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

Production is available at [githubprint.vercel.app](https://githubprint.vercel.app).

## Contributor Rule Editing

Repository identity inference is intentionally data-driven.

- Edit [`data/repo-identity/rules.json`](./data/repo-identity/rules.json) to add or refine stack-detection rules.
- Keep rules declarative: match public repo signals and emit languages, frameworks, surfaces, domains, flags, or confidence adjustments.
- Available signal sources include repository name, GitHub primary language, description, topics, root file names, root manifest contents, README text, and recent commit messages.
- The execution engine lives in [`lib/repo-identity.ts`](./lib/repo-identity.ts); contributors should not need to modify code for routine rule additions.
- Rule validation happens through Zod parsing in [`lib/schemas/repo-identity.ts`](./lib/schemas/repo-identity.ts).
- Run `npm run quality:regress` after editing rules to verify core stack inference and existing profile-scoring behavior.

### Environment Variables

| Variable                              | Required    | Purpose                                                     |
| ------------------------------------- | ----------- | ----------------------------------------------------------- |
| `GITHUB_TOKEN`                        | Recommended | Raises GitHub API limits and improves local reliability     |
| `GITHUB_CLIENT_ID`                    | Optional    | Enables GitHub sign-in; private access is an optional upgrade |
| `GITHUB_CLIENT_SECRET`                | Optional    | Enables GitHub sign-in; private access is an optional upgrade |
| `GITHUB_SESSION_SECRET`               | Optional    | Encrypts the server-side GitHub session cookie              |
| `OPENAI_API_KEY`                      | Optional    | Enables AI analysis; fallback still works without it        |
| `OPENAI_MODEL`                        | Optional    | Overrides the default model, currently `gpt-5-mini`         |
| `NEXT_PUBLIC_SITE_URL`                | Optional    | Canonical origin for metadata and Open Graph tags           |
| `GITHUBPRINT_USE_FIXTURE`             | Optional    | Enables local fixture mode for UI work                      |
| `GITHUBPRINT_CAPTURE_INSIGHTS`        | Optional    | Captures internal scoring snapshots for tuning              |
| `GITHUBPRINT_BENCHMARK_OVERRIDE_PATH` | Optional    | Loads an aggregated benchmark JSON during local testing     |

For the GitHub OAuth App used by signed-in self mode:

- Homepage URL: `https://githubprint.vercel.app`
- Authorization callback URL: `https://githubprint.vercel.app/api/auth/github/callback`
- Set `NEXT_PUBLIC_SITE_URL=https://githubprint.vercel.app` in Vercel for production

### Local GitHub Rate Limits

When you run without `GITHUB_TOKEN`, GitHubPrint:

- reduces GitHub fetch depth
- reuses the last successful local source from `.cache/`
- falls back to a minimal local document when no cache is available and GitHub is already rate-limited

### Fixture Mode

For UI work without external API calls:

```bash
GITHUBPRINT_USE_FIXTURE=1 npm run dev
```

Fixture mode is development-only.

## Scripts

| Command                      | Description                                               |
| ---------------------------- | --------------------------------------------------------- |
| `npm run dev`                | Start the Next.js development server                      |
| `npm run build`              | Create a production build                                 |
| `npm run start`              | Start the production server                               |
| `npm run typecheck`          | Run TypeScript checks                                     |
| `npm run check`              | Run build, typecheck, and quality regressions             |
| `npm run test:documents`     | Run Chromium export, pagination, mobile, and retry checks |
| `npm run quality:regress`    | Run fixture-based quality regressions                     |
| `npm run insights:aggregate` | Aggregate captured internal insight snapshots             |

## Verification

Before shipping or opening a PR:

```bash
npm run check
```

`npm run check` runs:

- production build
- TypeScript checks
- fixture-based quality regressions

Regression reports are written to `.cache/githubprint/reports/`.

For document and UI changes, also run:

```bash
npx playwright install chromium
npm run test:documents
```

The browser suite starts (or reuses) a server at `http://localhost:3107`. Use `localhost` when binding a development server; binding explicitly to `127.0.0.1` can produce locale rewrite loops in Next.js. Browser checks generate `.docx`, A4 PDF, and screen captures under `.cache/document-qa/`, plus standalone HTML and offline render captures under `.cache/html-qa/`. They validate both locales and all four templates, including long documents, links, fonts, mobile overflow, print cancellation, and download errors. Render generated DOCX files in a Word-compatible viewer for visual QA. Some headless LibreOffice distributions ignore embedded fonts; point Fontconfig at `public/fonts` when using those renderers.

## Additional Docs

- [Contributing](./CONTRIBUTING.md)
- [Learning Loop](./docs/learning-loop.md)
- [Document Exports](./docs/document-exports.md)

### SEO and social previews

The homepages link to indexable Korean and English guides for all four templates under `/templates/{brief,profile,insight,resume}` and `/en/templates/...`. Canonical URLs, reciprocal language alternatives, stable sitemap dates, structured data, and ten generated social preview images are maintained together. Private results and fictional previews remain excluded from indexing.

Run `npm run test:seo:browser` for crawler and social-image checks. See [SEO configuration and verification](docs/seo.md) for canonical-domain settings, search ownership verification variables, sitemap submission, and the route indexing policy.

### Private sources

Public-only is the default, even after sign-in. Brief, Profile, and Insight can optionally summarize or display up to three selected private projects. Resume separates private source storage from explicitly linked project enrichment. See [private data choices and verification](docs/private-data.md).
