import { NextResponse } from "next/server";
import { getGitHubSession } from "@/lib/auth";
import { hasPrivateRepoPermission } from "@/lib/document-options";
import { listPrivateRepositoryChoices } from "@/lib/github";

const headers = {
  "Cache-Control": "private, no-store",
  "X-Robots-Tag": "noindex, nofollow",
};
export async function GET() {
  const session = await getGitHubSession();
  if (!session)
    return NextResponse.json(
      { error: "authentication" },
      { status: 401, headers },
    );
  if (!hasPrivateRepoPermission(session.scopes))
    return NextResponse.json({ error: "permission" }, { status: 403, headers });
  try {
    const repositories = await listPrivateRepositoryChoices(
      session.user.login,
      {
        accessToken: session.accessToken,
        scopes: session.scopes,
        viewerUsername: session.user.login,
      },
    );
    return NextResponse.json({ repositories }, { headers });
  } catch {
    return NextResponse.json(
      { error: "repositories_unavailable" },
      { status: 502, headers },
    );
  }
}
