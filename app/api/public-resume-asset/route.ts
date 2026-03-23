import { NextRequest, NextResponse } from "next/server";
import { getPublicShowcaseResumeAsset } from "@/lib/showcase-resume";

const USERNAME_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,37}[a-z0-9])?$/i;

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get("username")?.trim() ?? "";
  const assetPath = request.nextUrl.searchParams.get("path")?.trim() ?? "";

  if (!USERNAME_PATTERN.test(username)) {
    return new NextResponse("Invalid username.", {
      status: 400,
    });
  }

  const asset = await getPublicShowcaseResumeAsset({
    filePath: assetPath,
    username,
  });

  if (!asset) {
    return new NextResponse("Asset not found.", {
      status: 404,
    });
  }

  return new NextResponse(new Uint8Array(asset.data), {
    headers: {
      "Cache-Control": "public, max-age=0, s-maxage=86400, stale-while-revalidate=86400",
      "Content-Type": asset.contentType,
    },
  });
}
