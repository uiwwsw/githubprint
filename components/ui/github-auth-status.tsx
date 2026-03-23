import Link from "next/link";
import {
  buildGitHubLoginPath,
  buildGitHubLogoutPath,
  getGitHubSession,
  hasGitHubOAuthConfig,
} from "@/lib/auth";
import { getDictionary, getLocalizedPathname } from "@/lib/i18n";
import { getShowcasePath } from "@/lib/showcase";
import type { Locale } from "@/lib/schemas";

export async function GitHubAuthStatus({ locale }: { locale: Locale }) {
  if (!hasGitHubOAuthConfig()) {
    return null;
  }

  const dict = getDictionary(locale);
  const session = await getGitHubSession();
  const redirectTo = getLocalizedPathname("/", locale);
  const showcasePath = getShowcasePath("uiwwsw", locale);

  if (!session) {
    return (
      <div className="mx-auto max-w-4xl rounded-[1.8rem] border border-black/[0.08] bg-white/[0.68] p-5 shadow-[0_24px_64px_-44px_rgba(0,0,0,0.45)] backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.24em] text-neutral-400">
              {dict.home.authEyebrow}
            </p>
            <h2 className="font-serif text-2xl text-neutral-950">{dict.home.authTitle}</h2>
            <p className="max-w-2xl text-sm leading-7 text-neutral-600">
              {dict.home.authDescription}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <a
              className="inline-flex h-11 items-center justify-center rounded-full bg-neutral-950 px-5 text-sm font-medium text-white shadow-[0_16px_40px_-24px_rgba(0,0,0,0.75)] transition hover:bg-neutral-800"
              href={buildGitHubLoginPath(redirectTo)}
            >
              {dict.home.authSignIn}
            </a>
            <Link
              className="inline-flex h-11 items-center justify-center rounded-full border border-black/[0.08] bg-white/80 px-5 text-sm font-medium text-neutral-900 transition hover:bg-white"
              href={showcasePath}
            >
              {dict.home.showcaseOpen}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl rounded-[1.8rem] border border-black/[0.08] bg-white/[0.68] p-5 shadow-[0_24px_64px_-44px_rgba(0,0,0,0.45)] backdrop-blur">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <img
            alt={session.user.login}
            className="h-14 w-14 rounded-[1.1rem] object-cover"
            src={session.user.avatarUrl}
          />
          <div className="space-y-1.5">
            <p className="text-[11px] uppercase tracking-[0.24em] text-neutral-400">
              {dict.home.authReadyEyebrow}
            </p>
            <p className="text-base font-medium text-neutral-950">
              {dict.home.authSignedInAs} @{session.user.login}
            </p>
            <p className="text-sm leading-7 text-neutral-600">
              {dict.home.authReadyMessage}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            className="inline-flex h-11 items-center justify-center rounded-full border border-black/[0.08] bg-white/80 px-5 text-sm font-medium text-neutral-900 transition hover:bg-white"
            href={session.user.profileUrl}
            rel="noreferrer"
            target="_blank"
          >
            GitHub
          </a>
          <a
            className="inline-flex h-11 items-center justify-center rounded-full border border-black/[0.08] px-5 text-sm font-medium text-neutral-700 transition hover:bg-white/80"
            href={buildGitHubLogoutPath(redirectTo)}
          >
            {dict.home.authSignOut}
          </a>
        </div>
      </div>
    </div>
  );
}
