# Search and sharing

## Public routes

The Korean homepage (`/`) and English homepage (`/en`) link to four server-rendered template guides: `/templates/brief`, `/templates/profile`, `/templates/insight`, and `/templates/resume`, plus their `/en` equivalents. Each guide explains its purpose, evidence, preparation, and export behavior, and links to related guides and the working preview. The homepage FAQ is present in the initial HTML, including its collapsed answers.

Each indexable page has a self-referencing canonical, reciprocal `ko`/`en` alternatives, and `x-default` pointing to Korean. Titles and descriptions describe the current PDF and Word features. Legacy `?lang=` links permanently redirect to the same page in the selected language and preserve other query parameters. The existing `/showcase/uiwwsw` alias continues to redirect to `/showcase`.

`lib/site-url.ts` uses `NEXT_PUBLIC_SITE_URL` as an origin. Production falls back to `https://githubprint.vercel.app`, never to Vercel's unique deployment URL. Set the variable when changing the primary domain. Preview deployments emit `noindex`; do not use a preview URL as the site's canonical origin.

## Sitemap and crawl controls

`/sitemap.xml` contains the 12 canonical public URLs and their language alternatives. It excludes result pages, examples, authentication endpoints, and legacy aliases. Home and guide dates are maintained in `PUBLIC_CONTENT_UPDATED_AT` in `lib/template-guides.ts`: update this value when the public content changes materially. A deploy by itself does not make content newly modified. The source-driven showcase omits an unknown modification date.

`/robots.txt` allows content, styles, and social images. It blocks authentication and private download routes, while leaving `/result` and `/preview` crawlable so crawlers can read their `noindex` directives. Those pages also send `X-Robots-Tag`. Authentication and private download responses carry `noindex` headers. Public showcase images remain available to crawlers.

A showcase with unavailable resume data sends `noindex` and omits Person/ProfilePage structured data until actual content is available. Authenticated result pages remain private. SEO changes do not alter the public resume masking rules.

## Structured data and share images

The home page describes a WebSite, WebApplication, and WebPage with stable identifiers. Guides provide WebPage and BreadcrumbList data tied to their visible content. The public showcase continues to use its masked resume for ProfilePage, Person, education, and project data. `StructuredData` escapes `<` before embedding JSON, including text read from repositories. No ratings, pricing claims, or search features that the app does not implement are fabricated.

`/share/{ko|en}/{home|brief|profile|insight|resume}.png` provides ten public 1200×630 images generated at build time using `ImageResponse` and the bundled Korean font. Open Graph and Twitter metadata refer to these images explicitly. They do not load GitHub data or require authentication.

## Verification and submission

Optional deployment environment variables add the corresponding verification meta tags:

- `GOOGLE_SITE_VERIFICATION`: content value supplied by Google Search Console.
- `NAVER_SITE_VERIFICATION`: content value supplied by Naver Search Advisor.
- `BING_SITE_VERIFICATION`: content value supplied by Bing Webmaster Tools.

Use the actual ownership verification values from the site's account; never invent them. After deploying a value, verify the property in that service and submit `https://githubprint.vercel.app/sitemap.xml` (or the configured primary origin). An existing DNS-verified property can use the sitemap directly. These code changes do not claim that ownership has been verified or that a sitemap has been submitted inside any external account.

## Checks

- `npm run check`: build, TypeScript, resume/showcase/proxy/SEO unit tests, and quality regressions.
- `npm run test:seo:browser`: HTML-only crawler checks for both homepages and all guides, canonical/hreflang/social metadata, structured data, sitemap, robots, redirects, noindex headers, share images, and responsive guide layouts.
- `npm run test:documents`: the full browser suite, including existing PDF/Word export regressions.

Use `DOCUMENT_TEST_URL` to check a deployed site. `SEO_CANONICAL_ORIGIN` defaults to `https://githubprint.vercel.app`; override it when testing a custom canonical domain. Generated visual artifacts are saved to `.cache/seo-qa/`.

References: [Google canonical guidance](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls), [localized pages](https://developers.google.com/search/docs/specialty/international/localized-versions), [accurate sitemap dates](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap), [crawlable noindex](https://developers.google.com/search/docs/crawling-indexing/block-indexing), and [Next.js metadata](https://nextjs.org/docs/app/getting-started/metadata-and-og-images).
