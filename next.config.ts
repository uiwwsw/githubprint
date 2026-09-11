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
      { source: "/api/auth/:path*", headers: privateHeaders },
      { source: "/api/resume-docx", headers: privateHeaders },
      { source: "/api/resume-asset", headers: privateHeaders },
    ];
  },
};

export default withNextIntl(nextConfig);
