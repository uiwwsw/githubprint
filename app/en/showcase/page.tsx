import type { Metadata } from "next";
import { ShowcasePageContent } from "@/components/pages/showcase-page-content";
import { buildShowcaseMetadata } from "@/lib/seo";
import { getShowcaseRecord } from "@/lib/showcase";
import { getPublicShowcaseResumeDocument } from "@/lib/showcase-resume";

export const revalidate = 86400;

export async function generateMetadata(): Promise<Metadata> {
  const showcase = getShowcaseRecord("uiwwsw");
  const resume = await getPublicShowcaseResumeDocument({
    locale: "en",
    repoUrl: showcase.resumeRepoUrl,
    username: showcase.username,
  });

  return buildShowcaseMetadata("en", "uiwwsw", resume);
}

export default function EnglishShowcasePage() {
  return <ShowcasePageContent locale="en" slug="uiwwsw" />;
}
