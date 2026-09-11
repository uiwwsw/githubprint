import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Let crawlers read noindex on /result and /preview. Public profile images
        // remain crawlable; only authentication and private download routes are blocked.
        disallow: ["/api/auth/", "/api/resume-docx", "/api/resume-asset"],
      },
    ],
    sitemap: `${getSiteUrl()}/sitemap.xml`,
    host: getSiteUrl(),
  };
}
