import type { MetadataRoute } from "next";
import { getPublicAlternates, getPublicUrl } from "@/lib/seo";
import { TEMPLATE_IDS, PUBLIC_CONTENT_UPDATED_AT } from "@/lib/template-guides";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    "/",
    ...TEMPLATE_IDS.map((id) => `/templates/${id}`),
    "/showcase",
  ];
  return paths.flatMap((pathname) =>
    (["ko", "en"] as const).map((locale) => ({
      url: getPublicUrl(pathname, locale),
      // The showcase follows its source repository; omit unknown modification dates.
      ...(pathname !== "/showcase"
        ? { lastModified: PUBLIC_CONTENT_UPDATED_AT }
        : {}),
      alternates: { languages: getPublicAlternates(pathname) },
    })),
  );
}
