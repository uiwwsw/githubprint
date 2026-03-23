import { NextRequest, NextResponse } from "next/server";
import { getGitHubSession } from "@/lib/auth";
import { getResumeRepoBinaryAsset, getResumeRepoLookup } from "@/lib/github";
import { getLocalResumeRepoBinaryAsset } from "@/lib/resume-source";

const ASSET_FILE_PATTERN =
  /^assets\/[a-z0-9/_.-]+\.(png|jpg|jpeg|gif|webp|bmp)$/i;

export async function GET(request: NextRequest) {
  const session = await getGitHubSession();

  if (!session) {
    return new NextResponse("Authentication is required.", {
      status: 401,
    });
  }

  const assetPath = request.nextUrl.searchParams.get("path")?.trim() ?? "";

  if (!ASSET_FILE_PATTERN.test(assetPath) || assetPath.includes("..")) {
    return new NextResponse("Invalid asset path.", {
      status: 400,
    });
  }

  const localAsset = await getLocalResumeRepoBinaryAsset(assetPath);

  if (localAsset) {
    return new NextResponse(new Uint8Array(localAsset.data), {
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": localAsset.contentType,
      },
    });
  }

  const authContext = {
    accessToken: session.accessToken,
    scopes: session.scopes,
    viewerUsername: session.user.login,
  };
  const lookup = await getResumeRepoLookup(session.user.login, {
    authContext,
  });

  if (!lookup) {
    return new NextResponse("Resume repository not found.", {
      status: 404,
    });
  }

  const asset = await getResumeRepoBinaryAsset(
    session.user.login,
    lookup.repo,
    assetPath,
    {
      authContext,
    },
  );

  if (!asset) {
    return new NextResponse("Asset not found.", {
      status: 404,
    });
  }

  return new NextResponse(new Uint8Array(asset.data), {
    headers: {
      "Cache-Control": "private, max-age=300",
      "Content-Type": asset.contentType,
    },
  });
}
