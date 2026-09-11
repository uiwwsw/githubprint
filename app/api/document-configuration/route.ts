import { NextRequest, NextResponse } from "next/server";
import { getGitHubSession } from "@/lib/auth";
import { createDocumentConfiguration } from "@/lib/document-configuration";
import {
  documentOptionsSchema,
  hasPrivateRepoPermission,
  needsPrivatePermission,
} from "@/lib/document-options";
import { getLocalizedResultPath } from "@/lib/i18n";

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
      { error: "authentication" },
      { status: 401, headers },
    );
  const body = await request.json().catch(() => null);
  const parsed = documentOptionsSchema.safeParse(body?.options);
  if (!parsed.success)
    return NextResponse.json(
      { error: "configuration" },
      { status: 400, headers },
    );
  if (
    needsPrivatePermission(parsed.data) &&
    !hasPrivateRepoPermission(session.scopes)
  )
    return NextResponse.json({ error: "permission" }, { status: 403, headers });
  const config = createDocumentConfiguration(parsed.data, session);
  const path = getLocalizedResultPath(
    parsed.data.template,
    body?.locale === "en" ? "en" : "ko",
  );
  return NextResponse.json(
    { url: `${path}?config=${encodeURIComponent(config)}` },
    { headers },
  );
}
