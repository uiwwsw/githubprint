import "server-only";
import type { GitHubAuthSession } from "@/lib/auth";
import { hasPrivateRepoPermission } from "@/lib/document-options";
import { GitHubFetchError } from "@/lib/github";
import { getResumeTemplateAvailability } from "@/lib/resume-source";
import type { Locale } from "@/lib/schemas";

export type ResumeReadiness = {
  state:
    | "ready"
    | "missing_repo"
    | "invalid_schema"
    | "authentication"
    | "permission"
    | "rate_limited"
    | "unavailable";
  detail?: string;
  repoVisibility?: "public" | "private";
};

/** Check only the explicitly selected source; never inspect linked private projects. */
export async function checkResumeReadiness(
  session: GitHubAuthSession,
  source: "public" | "authorized",
  locale: Locale,
): Promise<ResumeReadiness> {
  if (source === "authorized" && !hasPrivateRepoPermission(session.scopes))
    return { state: "permission" };
  try {
    const availability = await getResumeTemplateAvailability({
      authContext: {
        accessToken: session.accessToken,
        scopes: session.scopes,
        viewerUsername: session.user.login,
      },
      username: session.user.login,
      locale,
      forceFresh: true,
      allowPrivateSource: source === "authorized",
      allowPrivateProjects: false,
    });
    if (availability.state === "ready")
      return { state: "ready", repoVisibility: availability.repoVisibility };
    if (availability.state === "locked_missing_repo")
      return { state: "missing_repo" };
    return {
      state: "invalid_schema",
      detail: availability.detail.slice(0, 1000),
      repoVisibility: availability.repoVisibility,
    };
  } catch (error) {
    if (error instanceof GitHubFetchError) {
      if (error.code === "rate_limited") return { state: "rate_limited" };
      if (error.status === 401) return { state: "authentication" };
      if (error.status === 403) return { state: "permission" };
    }
    return { state: "unavailable" };
  }
}
