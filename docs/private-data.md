# Private data choices

GitHubPrint uses private data when you select private repositories for a document or open an authored resume stored in a private repository.

| Choice | Read | Included in PDF, Word, and HTML |
| --- | --- | --- |
| Repository list: Public only (default) | Public owned repository metadata | Up to five repository names, descriptions, and links |
| Repository list: Include private repositories | Public metadata and metadata for up to three selected, owned private repositories | Public entries and the selected private entries, marked Private |
| Resume only | The owner's `resume` repository and referenced files | Authored content and public linked-project metadata |

A private resume can include authored contact details, career history, and links in its saved files.

## Access and isolation

- Ordinary OAuth sign-in requests `read:user`. Private access is an explicit `repo` upgrade. `public_repo` never grants private access. GitHub's OAuth `repo` scope includes read and write access; the UI explains that GitHubPrint only makes read requests. GitHub does not provide a read-only equivalent OAuth scope. [GitHub scope documentation](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps)
- An explicitly opened private repository picker loads only owned repository names and archived status. The result reads repository metadata only for selected private entries. Resume uses its own source lookup.
- Home rendering does not read resume manifests or private repositories. Public mode remains public even with an older broad-scope token. Account-wide private contributions and private profile fields are not requested.
- Authenticated source requests use `no-store`. Repository documents are rendered from GitHub metadata without external AI or learning capture.
- Configuration POSTs require authentication, same-origin requests, schema validation, and permission checks. Result URLs contain an AES-GCM encrypted configuration, bound to the account and template, expiring after 24 hours. They contain no plaintext selected repository names or OAuth credentials. They do not grant access without the owner's authenticated session.
- The result, legacy DOCX endpoint, and resume image endpoint resolve the same configuration. Without it, they default to public access. Old `private=1` links and anonymous-summary configurations prompt users to choose sources again.
- A refused OAuth upgrade preserves the existing session. Permission choices restore only during an explicit, ten-minute OAuth round trip; older persistent private-toggle preferences are ignored.
- Local resume source overrides require an explicit environment path in development; adjacent folders are never read automatically.
- The curated public showcase remains a separate publishing route with its existing masking policy. It does not inherit a user's private configuration.

## Verification

`npm run test:privacy` exercises the API request trace, capability checks, expired/tampered/cross-account configurations, public-only reads with broad tokens, anonymous serialization, selected-only detail, public evidence reviews, all eight resume source/enrichment combinations, foreign-owner name collisions, private images, legacy exports, configuration POSTs, and OAuth cancellation.

`npm run test:privacy:browser` starts a separately instrumented test server with synthetic GitHub data. It checks authenticated ko/en configuration, permission gating, previews, and PDF/Word/HTML exports. The fixture is injected with a Node preload from the test command; no application route or production authentication bypass is added. Live OAuth approval and organization-specific GitHub restrictions still require the real account.

## Resume source checks and access recovery

The source check runs when the user selects Resume only. It can read a private `resume` source when the session already has private access or when the user connects it from the source status.

The generator checks `resume.yaml` and its referenced authored content through the authenticated, same-origin `POST /api/resume-readiness` endpoint. The request specifies public or authorized source access; public mode never probes a private source, and the check never enriches linked private projects. Responses contain readiness metadata rather than the document or tokens and use `private, no-store`.

A readable source enables the single document-generation action next to the source controls. Reconnect links appear only for actual authentication/access failures. Missing public sources explain the private-source choice; malformed YAML opens preparation help; temporary failures and rate limits offer a source retry. Changing source options cancels the previous check, and stale replies cannot overwrite the current selection.

Resume file discovery reads the complete root listing instead of the 24-file sample used for analysis signals. Authentication, authorization, and transient errors reading the manifest or Markdown propagate as access/network failures instead of being mislabeled as missing YAML.

OAuth redirects report connection, cancellation, expiry, failure, or a missing private grant. Granted scopes are read from the authenticated GitHub response headers, with the token response as fallback. Failed/cancelled upgrades preserve the previous session, and the existing account-bound, short-lived session-storage draft restores explicit source choices on return. The app does not revoke grants or expand permissions automatically. See [GitHub’s OAuth scope documentation](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps).
