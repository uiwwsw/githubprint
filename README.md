# GitFolio

GitFolio is a minimal two-page web app that turns a public GitHub URL into a polished developer document.

GitFolio는 공개 GitHub URL을 읽기 쉬운 개발자 문서로 바꿔 주는 2페이지 MVP입니다.

- Public page 1: `/`
- Public page 2: `/result`
- One analysis model, three presentation templates: `brief`, `profile`, `insight`
- A4-friendly preview with browser print-to-PDF download
- Bilingual UI and result generation: Korean and English

## Features

- Accepts both GitHub profile URLs and repository URLs
- Validates and extracts the GitHub username on the server
- Fetches public GitHub data on the server
- Uses OpenAI for structured JSON analysis with Zod validation
- Falls back to deterministic summary generation when AI is unavailable
- Supports Korean and English through path-based locale URLs
- Adds localized SEO metadata for Korean and English on the home page
- Marks dynamic result pages as `noindex` to avoid indexing user-specific documents
- Includes `robots.txt` and `sitemap.xml`

## Tech Stack

- Next.js 16 App Router
- TypeScript
- Tailwind CSS v4
- Zod
- OpenAI Responses API
- Server-side GitHub fetching

## Routes

- `/`
  - Input page
  - GitHub URL field
  - Template selector
  - Language toggle
- `/en`
  - English input page
- `/result`
  - Result document preview
  - Download action
  - Language toggle
- `/en/result`
  - English result document preview

The app still keeps one input flow and one result flow, with language-specific public paths.

## Localization

Supported locales:

- `ko` (default)
- `en`

How it works:

- Locale is handled through path-based public URLs.
- Korean uses `/` and `/result`.
- English uses `/en` and `/en/result`.
- The selected locale is preserved from input page to result page.
- UI copy, loading state, error state, metadata, and analysis output all follow the selected locale.
- Browser language detection is used only for UX suggestion on the home page, not for search-indexable HTML variation.
- Legacy `?lang=en` style URLs are redirected to path-based locale URLs.

Examples:

- `http://localhost:3000/`
- `http://localhost:3000/en`
- `http://localhost:3000/result?url=https%3A%2F%2Fgithub.com%2Fvercel&template=profile`
- `http://localhost:3000/en/result?url=https%3A%2F%2Fgithub.com%2Fvercel&template=insight`

## SEO

Home page SEO:

- Localized `title`, `description`, `keywords`
- Localized Open Graph and Twitter metadata
- Canonical and alternate language metadata for `/` and `/en`
- Path-based locale URLs instead of query-parameter locale URLs
- Search-indexable HTML no longer changes by `Accept-Language`

Result page SEO:

- Localized metadata for the selected locale
- `noindex, nofollow` because result pages are user-specific and query-driven

Discovery support:

- `app/robots.ts` serves `robots.txt`
- `app/sitemap.ts` serves `sitemap.xml`

Environment note:

- `NEXT_PUBLIC_SITE_URL` is used as the metadata base for canonical/Open Graph URLs

## Environment Variables

Copy the example file first:

```bash
cp .env.example .env.local
```

Required for best results:

- `GITHUB_TOKEN`
  - Recommended to avoid tight GitHub API rate limits
- `OPENAI_API_KEY`
  - Required for AI-generated structured analysis

Optional:

- `OPENAI_MODEL`
  - Defaults to `gpt-5-mini`
- `NEXT_PUBLIC_SITE_URL`
  - Defaults to `http://localhost:3000`
- `GITFOLIO_USE_FIXTURE=1`
  - Enables the local mock fixture in development only

## Local Setup

1. Install dependencies

```bash
npm install
```

2. Configure environment variables

```bash
cp .env.example .env.local
```

3. Run the development server

```bash
npm run dev
```

4. Open the app

```text
http://localhost:3000
```

## Product Flow

1. Enter a GitHub URL on `/`
2. Choose a template
3. Choose Korean or English if needed
4. Click convert
5. GitFolio fetches GitHub data on the server
6. GitFolio generates a structured analysis
7. `/result` renders the same data through the selected template
8. Download through the browser print/PDF flow

## Input Rules

Accepted:

- `https://github.com/username`
- `https://github.com/username/repository`
- `github.com/username`

Handled errors:

- Invalid GitHub URL format
- Unsupported host
- Failed username extraction
- Unknown user
- Organization account
- GitHub API rate limiting

## Architecture

- [`app/page.tsx`](<home>/gitfolio/app/page.tsx)
  - Input page and localized home metadata
- [`app/result/page.tsx`](<home>/gitfolio/app/result/page.tsx)
  - Result page, localized result metadata, localized error handling
- [`lib/github.ts`](<home>/gitfolio/lib/github.ts)
  - GitHub fetching, project scoring, caching, locale-aware activity/evidence signals
- [`lib/analyze.ts`](<home>/gitfolio/lib/analyze.ts)
  - OpenAI analysis, locale-aware fallback generation, structured JSON validation
- [`lib/i18n.ts`](<home>/gitfolio/lib/i18n.ts)
  - Locale resolution, path helpers, and UI copy
- [`lib/seo.ts`](<home>/gitfolio/lib/seo.ts)
  - Metadata helpers for bilingual SEO
- [`proxy.ts`](<home>/gitfolio/proxy.ts)
  - legacy locale query redirect and request locale headers for `html lang`
- [`lib/schemas.ts`](<home>/gitfolio/lib/schemas.ts)
  - Zod schemas for templates, locales, and analysis output
- [`components/templates/brief.tsx`](<home>/gitfolio/components/templates/brief.tsx)
- [`components/templates/profile.tsx`](<home>/gitfolio/components/templates/profile.tsx)
- [`components/templates/insight.tsx`](<home>/gitfolio/components/templates/insight.tsx)
- [`fixtures/mock-profile.ts`](<home>/gitfolio/fixtures/mock-profile.ts)
  - Development fixture

## Analysis Behavior

GitFolio only uses public GitHub signals such as:

- Profile metadata
- Repository descriptions
- README content
- Topics
- Top languages
- Stars
- Updated timestamps
- Pinned repository signals when available

Constraints:

- It does not invent career history
- It does not assume tenure, leadership, or business impact without evidence
- It keeps conclusions interpretive rather than absolute

## Caching

- GitHub fetches use a short server cache
- Analysis results also use a short cache
- Locale is part of the result generation flow, so Korean and English outputs are treated independently

## PDF Export

- No separate PDF microservice is used
- The result page is print-optimized HTML
- The download button uses the browser print flow
- Print CSS hides UI chrome and keeps the document layout clean on A4

## Fixture Mode

To work on UI quickly without hitting real APIs:

```bash
GITFOLIO_USE_FIXTURE=1 npm run dev
```

This is ignored in production.

## Verification

Verified locally with:

- `npm run typecheck`
- `npm run build`
