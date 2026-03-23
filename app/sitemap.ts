import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";
import { getShowcasePath } from "@/lib/showcase";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const now = new Date();

  return [
    {
      url: `${base}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
      alternates: {
        languages: {
          ko: `${base}/`,
          en: `${base}/en`,
        },
      },
    },
    {
      url: `${base}/en`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
      alternates: {
        languages: {
          ko: `${base}/`,
          en: `${base}/en`,
        },
      },
    },
    {
      url: `${base}${getShowcasePath("uiwwsw", "ko")}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
      alternates: {
        languages: {
          ko: `${base}${getShowcasePath("uiwwsw", "ko")}`,
          en: `${base}${getShowcasePath("uiwwsw", "en")}`,
        },
      },
    },
    {
      url: `${base}${getShowcasePath("uiwwsw", "en")}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
      alternates: {
        languages: {
          ko: `${base}${getShowcasePath("uiwwsw", "ko")}`,
          en: `${base}${getShowcasePath("uiwwsw", "en")}`,
        },
      },
    },
  ];
}
