# GitFolio

Turn a public GitHub URL into a polished, PDF-ready developer document.

공개 GitHub URL을 전달 가능한 개발자 문서로 바꾸는 2페이지 MVP입니다.

`Next.js 16` `TypeScript` `Tailwind CSS v4` `OpenAI` `GitHub API` `Bilingual UI`

[English](#english) | [한국어](#한국어) | [Contributing](./CONTRIBUTING.md)

## English

### Overview

GitFolio is a minimal product, not an analysis dashboard.

It keeps a single analysis model and renders that shared data through three document templates:

- `brief`: compressed, resume-adjacent summary
- `profile`: balanced default document
- `insight`: interpretation-heavy report

The product surface is intentionally small:

- Public page 1: `/`
- Public page 2: `/result`
- Localized public paths: `/en`, `/en/result`

The output is designed to feel like a document first, with A4-friendly print styles and browser PDF export.

### Product Contract

These constraints are intentional and should stay true unless the product direction changes:

- One input flow, one result flow
- No auth
- No dashboard
- No database for the MVP
- No extra public marketing pages
- One underlying analysis schema, multiple presentation templates
- Server-side GitHub fetch and server-side AI analysis
- Graceful deterministic fallback when OpenAI is unavailable

### What It Does

- Accepts a GitHub profile URL or repository URL
- Extracts the GitHub username on the server
- Fetches public GitHub profile and repository signals
- Selects representative projects from multiple weighted signals
- Generates a structured JSON analysis validated with Zod
- Falls back to a deterministic, data-driven profiling engine when the AI step fails
- Renders a print-optimized result page in Korean or English

### Localized Routing

- Korean home: `/`
- Korean result: `/result`
- English home: `/en`
- English result: `/en/result`

Locale switching is path-based, not query-based. Legacy `?lang=en` URLs are redirected to the canonical path form.

### SEO

Home pages are indexable and localized:

- localized `title`, `description`, `keywords`
- localized Open Graph and Twitter metadata
- canonical URLs for `/` and `/en`
- alternate language metadata for Korean and English
- `robots.txt` and `sitemap.xml`

Result pages are intentionally not indexed:

- `noindex, nofollow`
- user-specific and query-driven by design

### Architecture

| Path | Responsibility |
| --- | --- |
| [`/Users/uiwwsw/gitfolio/app/page.tsx`](/Users/uiwwsw/gitfolio/app/page.tsx) | Korean home route |
| [`/Users/uiwwsw/gitfolio/app/en/page.tsx`](/Users/uiwwsw/gitfolio/app/en/page.tsx) | English home route |
| [`/Users/uiwwsw/gitfolio/app/result/page.tsx`](/Users/uiwwsw/gitfolio/app/result/page.tsx) | Korean result route |
| [`/Users/uiwwsw/gitfolio/app/en/result/page.tsx`](/Users/uiwwsw/gitfolio/app/en/result/page.tsx) | English result route |
| [`/Users/uiwwsw/gitfolio/components/pages/home-page-content.tsx`](/Users/uiwwsw/gitfolio/components/pages/home-page-content.tsx) | Shared home page UI |
| [`/Users/uiwwsw/gitfolio/components/pages/result-page-content.tsx`](/Users/uiwwsw/gitfolio/components/pages/result-page-content.tsx) | Shared result page flow |
| [`/Users/uiwwsw/gitfolio/lib/github.ts`](/Users/uiwwsw/gitfolio/lib/github.ts) | GitHub fetching, scoring, caching |
| [`/Users/uiwwsw/gitfolio/lib/analyze.ts`](/Users/uiwwsw/gitfolio/lib/analyze.ts) | OpenAI analysis and deterministic fallback entry point |
| [`/Users/uiwwsw/gitfolio/lib/data-loader.ts`](/Users/uiwwsw/gitfolio/lib/data-loader.ts) | Loads and validates the profiling rule config |
| [`/Users/uiwwsw/gitfolio/lib/profile-features.ts`](/Users/uiwwsw/gitfolio/lib/profile-features.ts) | Extracts normalized features from raw GitHub data |
| [`/Users/uiwwsw/gitfolio/lib/rule-engine.ts`](/Users/uiwwsw/gitfolio/lib/rule-engine.ts) | Scores orientations, working styles, strengths, and roles |
| [`/Users/uiwwsw/gitfolio/lib/narrative-writer.ts`](/Users/uiwwsw/gitfolio/lib/narrative-writer.ts) | Turns scored signals into the final analysis JSON |
| [`/Users/uiwwsw/gitfolio/lib/schemas.ts`](/Users/uiwwsw/gitfolio/lib/schemas.ts) | Zod schemas for search params and analysis output |
| [`/Users/uiwwsw/gitfolio/data/`](/Users/uiwwsw/gitfolio/data) | Collaborator-editable profiling signals, rules, and narrative copy |
| [`/Users/uiwwsw/gitfolio/lib/i18n.ts`](/Users/uiwwsw/gitfolio/lib/i18n.ts) | Dictionaries, locale helpers, localized path logic |
| [`/Users/uiwwsw/gitfolio/lib/seo.ts`](/Users/uiwwsw/gitfolio/lib/seo.ts) | Metadata builders |
| [`/Users/uiwwsw/gitfolio/proxy.ts`](/Users/uiwwsw/gitfolio/proxy.ts) | Locale query redirect and request locale header |
| [`/Users/uiwwsw/gitfolio/components/templates/brief.tsx`](/Users/uiwwsw/gitfolio/components/templates/brief.tsx) | Brief document template |
| [`/Users/uiwwsw/gitfolio/components/templates/profile.tsx`](/Users/uiwwsw/gitfolio/components/templates/profile.tsx) | Profile document template |
| [`/Users/uiwwsw/gitfolio/components/templates/insight.tsx`](/Users/uiwwsw/gitfolio/components/templates/insight.tsx) | Insight document template |

### Prerequisites

- Node.js `20.9+`
- npm `10+`
- `GITHUB_TOKEN` recommended
- `OPENAI_API_KEY` required for AI analysis

### Getting Started

1. Install dependencies.

```bash
npm install
```

2. Copy environment variables.

```bash
cp .env.example .env.local
```

3. Start the development server.

```bash
npm run dev
```

4. Open the app.

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
| `GITHUB_TOKEN` | Recommended | Raises GitHub API limits and improves reliability |
| `OPENAI_API_KEY` | Yes | Enables structured analysis generation |
| `OPENAI_MODEL` | No | Overrides the default model, currently `gpt-5-mini` |
| `NEXT_PUBLIC_SITE_URL` | No | Canonical origin for metadata, defaults to `https://gitfolio-seven.vercel.app` |
| `GITFOLIO_USE_FIXTURE` | No | Enables local fixture mode for development only |

### Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the local Next.js dev server |
| `npm run build` | Create a production build |
| `npm run start` | Run the production server |
| `npm run typecheck` | Run TypeScript checks |
| `npm run check` | Run typecheck and production build |

### Fixture Mode

For UI work without external API calls:

```bash
GITFOLIO_USE_FIXTURE=1 npm run dev
```

Fixture mode is a development convenience only. Production paths must not use fake data.

In local development without a `GITHUB_TOKEN`, GitFolio automatically switches to a lighter GitHub fetch mode and will reuse the last successful local source snapshot from `.cache/` if GitHub rate limits are hit later.

### Data-Driven Profiling Engine

The deterministic fallback is not hardcoded in one file anymore.

It now follows this pipeline:

1. `lib/github.ts` collects public GitHub profile, repo, README, root-file, and recent-commit signals
2. `lib/profile-features.ts` normalizes those signals into comparable feature matches
3. `data/signals/*.json` defines which languages, topics, files, keywords, and commit patterns matter
4. `data/rules/*.json` defines how those signals map to orientations, working styles, strengths, and role fit
5. `data/templates/narratives.json` defines the shareable copy bands used in the final document

If you want to tune the interpretation logic, prefer editing `data/*.json` first before changing TypeScript code.

### Verification

Before shipping or opening a PR:

```bash
npm run check
```

### Collaboration Notes

If you are contributing to GitFolio, preserve these rules:

- Keep the user-facing product to two primary pages
- Do not add auth, dashboards, or persistence-heavy flows unless product direction changes
- Do not expose `GITHUB_TOKEN` or `OPENAI_API_KEY` to the client
- Keep result pages printable and PDF-friendly
- Keep AI output schema-first and validated with Zod
- If the AI step fails, the result page must still render via fallback
- Do not invent facts beyond public GitHub evidence

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the collaborator workflow.

### Troubleshooting

| Problem | What to check |
| --- | --- |
| GitHub rate limiting | Set `GITHUB_TOKEN`, then retry after reset |
| Empty or missing result | Check URL normalization and public profile availability |
| AI output rejection | Review schema validation in [`/Users/uiwwsw/gitfolio/lib/schemas.ts`](/Users/uiwwsw/gitfolio/lib/schemas.ts) and fallback logic in [`/Users/uiwwsw/gitfolio/lib/analyze.ts`](/Users/uiwwsw/gitfolio/lib/analyze.ts) |
| Wrong locale page | Use `/` for Korean and `/en` for English |

## 한국어

### 개요

GitFolio는 분석 대시보드가 아니라, 공개 GitHub를 읽기 쉬운 문서로 바꾸는 작은 제품입니다.

핵심 원칙은 단순합니다.

- 사용자에게 보이는 주요 흐름은 입력 페이지와 결과 페이지 두 개뿐입니다.
- 분석 데이터 모델은 하나이고, 템플릿만 다르게 보여 줍니다.
- 결과물은 웹 페이지이면서 동시에 A4 출력과 브라우저 PDF 저장에 맞춰져 있습니다.

### 제품 구조

- 한국어 홈: `/`
- 한국어 결과: `/result`
- 영어 홈: `/en`
- 영어 결과: `/en/result`

### 주요 기능

- profile URL과 repo URL 모두 입력 가능
- 서버에서 GitHub username 추출 및 검증
- 공개 GitHub 데이터 서버 수집
- OpenAI 구조화 분석 JSON 생성
- AI 실패 시 `data/*.json` 규칙 기반 deterministic fallback 생성
- 한국어/영어 UI 및 결과 문서 지원
- 홈 페이지 다국어 SEO 지원
- 결과 페이지 `noindex` 처리

### 빠른 시작

```bash
npm install
cp .env.example .env.local
npm run dev
```

브라우저에서 `http://localhost:3000`을 열면 됩니다.

배포 주소는 `https://gitfolio-seven.vercel.app` 입니다.

로컬에서 `GITHUB_TOKEN` 없이 실행하면 GitHub 호출 수를 자동으로 줄이고, 한 번 성공한 결과는 `.cache/`에 저장해 rate limit 시 재사용합니다. 그래도 실제 데이터 품질을 위해서는 `GITHUB_TOKEN` 설정을 권장합니다.

### 환경 변수

| 변수 | 필수 여부 | 설명 |
| --- | --- | --- |
| `GITHUB_TOKEN` | 권장 | GitHub API rate limit 완화 |
| `OPENAI_API_KEY` | 필수 | AI 분석 생성 |
| `OPENAI_MODEL` | 선택 | 기본값은 `gpt-5-mini` |
| `NEXT_PUBLIC_SITE_URL` | 선택 | canonical / OG 메타데이터 기준 주소. 기본값은 `https://gitfolio-seven.vercel.app` |
| `GITFOLIO_USE_FIXTURE` | 선택 | 개발 전용 fixture 모드 |

### 데이터 기반 판단 엔진

현재 fallback 분석은 한 파일의 하드코딩 문장이 아니라, 아래 구조로 동작합니다.

1. `lib/github.ts`가 공개 GitHub profile, repo, README, root file, 최근 commit 신호를 수집
2. `lib/profile-features.ts`가 이를 정규화된 feature로 변환
3. `data/signals/*.json`이 어떤 언어, topic, 파일, 키워드, commit 패턴을 읽을지 정의
4. `data/rules/*.json`이 orientation, working style, strength, role 판단 규칙을 정의
5. `data/templates/narratives.json`이 최종 문서 문장 밴드를 정의

해석 기준을 조정하고 싶다면 TypeScript보다 먼저 `data/*.json`을 수정하는 것이 기본 원칙입니다.

### 협업 가이드

협업 시에는 아래 원칙을 유지하는 것이 중요합니다.

- 퍼블릭 제품 구조는 두 페이지를 유지합니다.
- auth, dashboard, DB 의존 기능은 MVP 범위를 벗어나므로 함부로 추가하지 않습니다.
- 비밀키는 클라이언트에 노출하지 않습니다.
- 결과 페이지는 항상 인쇄 가능한 문서 형태를 유지합니다.
- AI 응답은 반드시 스키마 검증을 거칩니다.
- AI 실패 시에도 결과 페이지는 fallback으로 깨지지 않아야 합니다.
- GitHub 공개 정보 이상을 단정적으로 만들어내지 않습니다.
- 판단 기준을 바꿀 때는 가능하면 `data/*.json`을 먼저 수정합니다.
- 해석 기준을 바꿀 때는 가능하면 `data/*.json`을 먼저 수정하고, 엔진 코드는 신호 추출과 점수 계산에만 집중합니다.

자세한 협업 규칙은 [CONTRIBUTING.md](./CONTRIBUTING.md)를 참고하면 됩니다.

### 검증

출시 전이나 PR 전에는 아래 명령을 권장합니다.

```bash
npm run check
```
