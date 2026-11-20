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
    <img alt="GitHub API" src="https://img.shields.io/badge/GitHub_API-public_data-181717?logo=github" />
    <img alt="Locale" src="https://img.shields.io/badge/Locale-KO%20%2F%20EN-555555" />
  </p>
</div>

## English

### Overview

GitHubPrint makes two documents from your signed-in GitHub account.

- **Repository list** shows repository names, GitHub descriptions, and links. It includes up to five recent public repositories and, if you choose, up to three private repositories. Brief, Profile, and Insight are three designs for the same list.
- **Resume only** formats the resume you wrote in the root `resume.yaml` of your `resume` repository. See the [setup guide](./docs/resume-template.md).
- Both modes support Korean and English and export A4 PDF, editable Word, or offline HTML.

### Scope

Repository lists use public GitHub profile and repository metadata. GitHubPrint reads selected private repository metadata only after you enable private access and pick repositories. An authored resume can also be stored in a private `resume` repository. See [private data choices](./docs/private-data.md).

Current product limits:

- individual developer accounts only; organization accounts are not supported
- result pages are query-driven and intentionally not indexed
- local development is more reliable with `GITHUB_TOKEN`
- personal documents require sign-in to your own GitHub account

### Features

- Three repository list designs and one authored resume template
- Server-side GitHub URL normalization and public data collection
- Print-friendly result pages with browser PDF export
- Editable Word / Google Docs-compatible `.docx` exports for all four templates, with standard fonts and no font embedding
- Responsive, offline HTML files preserving the template markup, fonts, photos, cards, and A4 print styles
- A purpose-based save dialog, document navigation, and link copying for explicitly public examples/showcases
- Public example previews at `/preview` and `/en/preview` without sign-in
- A starter `resume` repository guide with photo support in [`docs/resume-template.md`](./docs/resume-template.md)
- Fixture mode for UI work without external API calls

## 한국어

### 개요

GitHubPrint에서 본인 GitHub 계정으로 문서 두 종류를 만들 수 있습니다.

- **저장소 목록**은 저장소 이름, GitHub 설명, 링크를 담습니다. 최근 공개 저장소는 최대 5개까지 표시하고, 직접 고른 비공개 저장소를 최대 3개 추가할 수 있습니다. Brief, Profile, Insight 디자인은 같은 목록을 사용합니다.
- **이력서 전용**은 `resume` 저장소 루트에 직접 작성한 `resume.yaml`을 문서로 만듭니다. [이력서 작성 방법](./docs/resume-template.md)을 참고하세요.
- 두 모드 모두 한국어와 영어를 지원하며, PDF, Word, HTML로 저장할 수 있습니다.

현재 제품 제약:

- 개인 개발자 계정만 지원하며, 조직 계정은 지원하지 않습니다
- 결과 페이지는 쿼리 기반 경로이며 검색 인덱싱 대상이 아닙니다
- 로컬 개발은 `GITHUB_TOKEN`이 있을 때 더 안정적입니다
- 개인 문서는 본인 GitHub 계정으로 로그인한 뒤 만들 수 있습니다

### 주요 기능

- 저장소 목록 디자인 3개와 직접 작성한 이력서용 템플릿
- 서버 측 GitHub URL 정규화 및 공개 데이터 수집
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
| `lib/github.ts`                                  | Public and selected private repository metadata, resume sources, and fixtures     |
| `lib/repo-identity.ts`                           | Contributor-editable repository identity inference driven by JSON rules           |
| `lib/analyze.ts`                                 | Legacy analysis and regression tooling                                           |
| `lib/profile-features.ts`                        | Feature extraction from raw GitHub source data                                    |
| `data/signals/`                                  | Signal definitions for languages, topics, files, and commit patterns              |
| `data/repo-identity/`                            | JSON rules for contributor-editable stack, framework, and project-type inference  |
| `data/rules/`                                    | Scoring rules for orientation, working style, strengths, and role fit             |
| `lib/evidence-review.ts`                               | Project evidence inventory                                                       |
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
| `OPENAI_API_KEY`                      | Optional    | Used by the legacy analysis module                          |
| `OPENAI_MODEL`                        | Optional    | Overrides the model used by the legacy analysis module      |
| `NEXT_PUBLIC_SITE_URL`                | Optional    | Canonical origin for metadata and Open Graph tags           |
| `GITHUBPRINT_USE_FIXTURE`             | Optional    | Enables local fixture mode for UI work                      |
| `GITHUBPRINT_CAPTURE_INSIGHTS`        | Optional    | Captures internal scoring snapshots for tuning              |

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

The browser suite starts (or reuses) a server at `http://localhost:3107`. Use `localhost` when binding a development server; binding explicitly to `127.0.0.1` can produce locale rewrite loops in Next.js. Browser checks generate `.docx`, A4 PDF, and screen captures under `.cache/document-qa/`, plus standalone HTML and offline render captures under `.cache/html-qa/`. They validate both locales and all four templates, including long documents, links, fonts, mobile overflow, print cancellation, and download errors. Render generated DOCX files in a Word-compatible viewer for visual QA. Run `npm run test:docx:structure` with a .NET 8 SDK to validate generated packages using the Microsoft Open XML SDK. Word uses standard fonts; PDF and HTML retain their template fonts.

## Additional Docs

- [Contributing](./CONTRIBUTING.md)
- [Learning Loop](./docs/learning-loop.md)
- [Document Exports](./docs/document-exports.md)

### SEO and social previews

The homepages link to indexable Korean and English guides for all four templates under `/templates/{brief,profile,insight,resume}` and `/en/templates/...`. Canonical URLs, reciprocal language alternatives, stable sitemap dates, structured data, and ten generated social preview images are maintained together. Private results and fictional previews remain excluded from indexing.

Run `npm run test:seo:browser` for crawler and social-image checks. See [SEO configuration and verification](docs/seo.md) for canonical-domain settings, search ownership verification variables, sitemap submission, and the route indexing policy.

### Private sources

Public-only is the default, even after sign-in. Brief, Profile, and Insight can optionally summarize or display up to three selected private projects. Resume separates private source storage from explicitly linked project enrichment. See [private data choices and verification](docs/private-data.md).

Percentile rankings have been removed. See [the evidence review and ranking audit](docs/evidence-review.md) for the source limitations, replacement behavior, and verification.

### Reusing the Resume renderer

`ResumeTemplate` accepts `authoredOnly` for partner views such as 9BOX. It keeps the same document layout and authored entries while omitting repository enrichment descriptions, inferred project labels and repository creation metadata. The default GitHubPrint document is unchanged. Both Korean and English use the same option. Consumers should copy a pinned renderer and its pure normalizer with provenance, and must enforce their own document access checks; do not embed authenticated result URLs or forward GitHub credentials.
