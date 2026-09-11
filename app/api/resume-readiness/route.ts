import { NextRequest, NextResponse } from "next/server";
import { getGitHubSession } from "@/lib/auth";
import { checkResumeReadiness } from "@/lib/resume-readiness";
const headers = {
  "Cache-Control": "private, no-store",
  "X-Robots-Tag": "noindex, nofollow",
};
export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin)
    return NextResponse.json({ error: "origin" }, { status: 403, headers });
  const session = await getGitHubSession();
  if (!session)
    return NextResponse.json(
      { state: "authentication" },
      { status: 401, headers },
    );
  const body = await request.json().catch(() => null);
  if (
    !body ||
    !["public", "authorized"].includes(body.source) ||
    !["ko", "en"].includes(body.locale)
  )
    return NextResponse.json(
      { error: "configuration" },
      { status: 400, headers },
    );
  return NextResponse.json(
    await checkResumeReadiness(session, body.source, body.locale),
    { headers },
  );
}
