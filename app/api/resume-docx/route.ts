import { NextRequest, NextResponse } from "next/server";
import { getGitHubSession } from "@/lib/auth";
import { buildResumeDocx } from "@/lib/resume-docx";
import { getResumeRepoBinaryAsset, getResumeRepoLookup } from "@/lib/github";
import {
  getLocalResumeRepoBinaryAsset,
  getResumeTemplateAvailability,
} from "@/lib/resume-source";
import { buildDownloadFileName } from "@/lib/result-document";
import { resolveLocale } from "@/lib/i18n";

export async function GET(request: NextRequest) {
  const session = await getGitHubSession();

  if (!session) {
    return new NextResponse("Authentication is required.", {
      status: 401,
    });
  }

  const locale = resolveLocale(request.nextUrl.searchParams.get("lang"));
  const availability = await getResumeTemplateAvailability({
    authContext: {
      accessToken: session.accessToken,
      scopes: session.scopes,
      viewerUsername: session.user.login,
    },
    locale,
    username: session.user.login,
  });

  if (availability.state !== "ready") {
    return new NextResponse("Resume template is not ready.", {
      status: 409,
    });
  }

  const authContext = {
    accessToken: session.accessToken,
    scopes: session.scopes,
    viewerUsername: session.user.login,
  };
  const localAvatarAsset = availability.document.basics.avatarPath
    ? await getLocalResumeRepoBinaryAsset(
        availability.document.basics.avatarPath,
      )
    : null;
  const lookup = !localAvatarAsset && availability.document.basics.avatarPath
    ? await getResumeRepoLookup(session.user.login, {
        authContext,
      })
    : null;
  const avatarAsset =
    localAvatarAsset ??
    (lookup && availability.document.basics.avatarPath
      ? await getResumeRepoBinaryAsset(
          session.user.login,
          lookup.repo,
          availability.document.basics.avatarPath,
          { authContext },
        )
      : null);
  const buffer = await buildResumeDocx(
    availability.document,
    locale,
    {
      avatarAsset,
      fallbackAvatarUrl: session.user.avatarUrl,
    },
  );
  const fileName = `${buildDownloadFileName({
    generatedAt: new Date().toISOString(),
    template: "resume",
    username: session.user.login,
  })}.docx`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    },
  });
}
