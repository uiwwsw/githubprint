import { resolveDocumentConfiguration } from "@/lib/document-configuration";
import type { DocumentOptions } from "@/lib/document-options";
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

  let configuration: DocumentOptions;
  const config = request.nextUrl.searchParams.get("config") ?? undefined;
  try {
    configuration = resolveDocumentConfiguration(config, "resume", session);
  } catch {
    return new NextResponse("Choose your document sources again.", {
      status: 403,
      headers: { "Cache-Control": "private, no-store" },
    });
  }

  const locale = resolveLocale(request.nextUrl.searchParams.get("lang"));
  const availability = await getResumeTemplateAvailability({
    allowPrivateSource: configuration.resumeSource === "authorized",
    allowPrivateProjects: configuration.resumeProjects === "authorized",
    assetContext: config,
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
  const lookup =
    !localAvatarAsset && availability.document.basics.avatarPath
      ? await getResumeRepoLookup(session.user.login, {
          authContext,
          allowPrivate: configuration.resumeSource === "authorized",
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
  const buffer = await buildResumeDocx(availability.document, locale, {
    avatarAsset,
    fallbackAvatarUrl: session.user.avatarUrl,
  });
  const fileName = `${buildDownloadFileName({
    generatedAt: new Date().toISOString(),
    template: "resume",
    username: session.user.login,
  })}.docx`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    },
  });
}
