# Private data choices

Private work has two separate uses: supplementing public GitHub evidence, and storing an authored resume without publishing its source. Signing in alone does not opt into either use.

| Template / choice | Read | Included in PDF, Word, and HTML |
| --- | --- | --- |
| Brief, Profile, Insight: Public only (default) | Public profile and public owned repositories | Public evidence only |
| Analysis: Summarize private work | Public sources plus up to three explicitly selected owned private repositories | Selected-work counts, recognized technology labels, documentation/testing/automation signals; no private names, descriptions, URLs, README text, commit text, or arbitrary topics |
| Analysis: Private details | The same selected sources | Selected private projects labeled Private, including names, descriptions, and links |
| Resume: Public source (default) | Public `resume` repository, locale manifest, referenced Markdown and image assets | Authored content plus public linked-project metadata |
| Resume: Allow private source | The owner's `resume` repository, including when private; referenced source files only | Authored content, including contact details and links. Private storage does **not** anonymize authored content |
| Resume: Enrich linked private projects | Only owner-qualified `repo` fields explicitly referenced in the selected manifest, up to 30 unique missing references | Verified private repository descriptions, technology metadata, and links labeled Private. Authored prose is preserved |

Use anonymous summaries when public activity understates private implementation work; use details for projects the author can disclose. Insight benchmarks always use public evidence. Private work is not a basis for inventing career history, collaboration quality, or business outcomes. Technology combinations can still reveal the nature of a project; anonymous aggregates need review before sharing.

## Access and isolation

- Ordinary OAuth sign-in requests `read:user`. Private access is an explicit `repo` upgrade. `public_repo` never grants private access. GitHub's OAuth `repo` scope includes read and write access; the UI explains that GitHubPrint only makes read requests. GitHub does not provide a read-only equivalent OAuth scope. [GitHub scope documentation](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps)
- An explicitly opened private repository picker loads only owned repository names and archived status. Analysis reads contents only after selection. Resume never uses this all-repository picker.
- Home rendering does not read resume manifests or private repositories. Public mode remains public even with an older broad-scope token. Account-wide private contributions and private profile fields are not requested.
- Authenticated source requests use `no-store`. Private analyses bypass external AI, shared analysis caches, and learning capture. Anonymous mode removes raw private repositories before narrative generation and browser serialization; public benchmark construction runs on a public-only source.
- Configuration POSTs require authentication, same-origin requests, schema validation, and permission checks. Result URLs contain an AES-GCM encrypted configuration, bound to the account and template, expiring after 24 hours. They contain no plaintext selected repository names or OAuth credentials. They do not grant access without the owner's authenticated session.
- The result, legacy DOCX endpoint, and resume image endpoint resolve the same configuration. Without it, they default to public access. Old `private=1` links require a new explicit selection rather than silently enabling broad access.
- A refused OAuth upgrade preserves the existing session. Permission choices restore only during an explicit, ten-minute OAuth round trip; older persistent private-toggle preferences are ignored.
- Local resume source overrides require an explicit environment path in development; adjacent folders are never read automatically.
- The curated public showcase remains a separate publishing route with its existing masking policy. It does not inherit a user's private configuration.

## Verification

`npm run test:privacy` exercises the API request trace, capability checks, expired/tampered/cross-account configurations, public-only reads with broad tokens, anonymous serialization, selected-only detail, public benchmarks, all eight resume source/enrichment combinations, foreign-owner name collisions, private images, legacy exports, configuration POSTs, and OAuth cancellation.

`npm run test:privacy:browser` starts a separately instrumented test server with synthetic GitHub data. It checks authenticated ko/en configuration, permission gating, previews, and PDF/Word/HTML exports. The fixture is injected with a Node preload from the test command; no application route or production authentication bypass is added. Live OAuth approval and organization-specific GitHub restrictions still require the real account.
