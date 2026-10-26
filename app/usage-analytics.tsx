"use client";
import { useEffect } from "react";

declare global {
  interface Window { movvUsage?: { screen(name: string): void; setConsent?(allowed: boolean): void } }
}

const config = {
  "service": "githubprint",
  "origin": "https://githubprint.vercel.app",
  "hosts": [
    "githubprint.vercel.app"
  ],
  "routes": [
    {
      "match": "^/$",
      "path": "/",
      "name": "ko_home"
    },
    {
      "match": "^/showcase/?$",
      "path": "/showcase",
      "name": "ko_showcase"
    },
    {
      "match": "^/showcase/[^/]+/?$",
      "path": "/showcase/:item",
      "name": "ko_showcase_detail"
    },
    {
      "match": "^/preview/?$",
      "path": "/preview",
      "name": "ko_preview"
    },
    {
      "match": "^/templates/(?:brief|profile|insight|resume)/?$",
      "path": "/templates/:item",
      "name": "ko_template_guide"
    },
    {
      "match": "^/result/?$",
      "path": "/result",
      "name": "ko_result"
    },
    {
      "match": "^/result/(?:brief|profile|insight|resume)/?$",
      "path": "/result/:item",
      "name": "ko_result_template"
    },
    {
      "match": "^/ko/?$",
      "path": "/ko",
      "name": "ko_home"
    },
    {
      "match": "^/ko/showcase/?$",
      "path": "/ko/showcase",
      "name": "ko_showcase"
    },
    {
      "match": "^/ko/showcase/[^/]+/?$",
      "path": "/ko/showcase/:item",
      "name": "ko_showcase_detail"
    },
    {
      "match": "^/ko/preview/?$",
      "path": "/ko/preview",
      "name": "ko_preview"
    },
    {
      "match": "^/ko/templates/(?:brief|profile|insight|resume)/?$",
      "path": "/ko/templates/:item",
      "name": "ko_template_guide"
    },
    {
      "match": "^/ko/result/?$",
      "path": "/ko/result",
      "name": "ko_result"
    },
    {
      "match": "^/ko/result/(?:brief|profile|insight|resume)/?$",
      "path": "/ko/result/:item",
      "name": "ko_result_template"
    },
    {
      "match": "^/en/?$",
      "path": "/en",
      "name": "en_home"
    },
    {
      "match": "^/en/showcase/?$",
      "path": "/en/showcase",
      "name": "en_showcase"
    },
    {
      "match": "^/en/showcase/[^/]+/?$",
      "path": "/en/showcase/:item",
      "name": "en_showcase_detail"
    },
    {
      "match": "^/en/preview/?$",
      "path": "/en/preview",
      "name": "en_preview"
    },
    {
      "match": "^/en/templates/(?:brief|profile|insight|resume)/?$",
      "path": "/en/templates/:item",
      "name": "en_template_guide"
    },
    {
      "match": "^/en/result/?$",
      "path": "/en/result",
      "name": "en_result"
    },
    {
      "match": "^/en/result/(?:brief|profile|insight|resume)/?$",
      "path": "/en/result/:item",
      "name": "en_result_template"
    }
  ],
  "controls": [
    "export_open",
    "result_copy_link"
  ]
};

export function UsageAnalytics() {
  useEffect(() => {
    if (!config.hosts.includes(window.location.hostname) || document.getElementById("service-usage-loader")) return;
    const script = document.createElement("script");
    script.id = "service-usage-loader";
    script.type = "module";
    script.src = "/usage-analytics.js";
    script.dataset.usageConfig = JSON.stringify(config);
    document.head.append(script);
  }, []);
  return null;
}
