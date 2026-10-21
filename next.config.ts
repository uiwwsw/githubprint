import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  agentRules: false,
  async headers() {
    const privateHeaders = [
      { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
    ];
    return [
      { source: "/:path*", headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      ] },
      { source: "/api/auth/:path*", headers: privateHeaders },
      { source: "/api/resume-docx", headers: privateHeaders },
      { source: "/api/resume-asset", headers: privateHeaders },
      { source: "/api/document-configuration", headers: privateHeaders },
      { source: "/api/github/:path*", headers: privateHeaders },
    ];
  },
};

export default withNextIntl(nextConfig);
