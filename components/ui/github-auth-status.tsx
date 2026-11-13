import {
  buildGitHubLogoutPath,
  getGitHubSession,
  hasGitHubOAuthConfig,
} from "@/lib/auth";
import { getDictionary, getLocalizedPathname } from "@/lib/i18n";
import type { Locale } from "@/lib/schemas";

export async function GitHubAuthStatus({ locale }: { locale: Locale }) {
  if (!hasGitHubOAuthConfig()) {
    return null;
  }

  const dict = getDictionary(locale);
  const session = await getGitHubSession();
  // Signed-out visitors get the sign-in action in the page hero.
  if (!session) return null;
  const redirectTo = getLocalizedPathname("/", locale);

  return (
    <div className="gp-signed-in">
      <div className="gp-signed-in-who">
        <img alt="" src={session.user.avatarUrl} />
        <div className="min-w-0">
          <p>
            {dict.home.authSignedInAs} @{session.user.login}
          </p>
          <p>{dict.home.authReadyMessage}</p>
        </div>
      </div>
      <div className="gp-signed-in-actions">
        <a
          className="gp-text-link"
          href={session.user.profileUrl}
          rel="noreferrer"
          target="_blank"
        >
          GitHub
        </a>
        <a className="gp-text-link" href={buildGitHubLogoutPath(redirectTo)}>
          {dict.home.authSignOut}
        </a>
      </div>
    </div>
  );
}
