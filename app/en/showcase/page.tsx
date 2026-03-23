import type { Metadata } from "next";
import { ShowcasePageContent } from "@/components/pages/showcase-page-content";
import { buildShowcaseMetadata } from "@/lib/seo";

export const revalidate = 86400;
export const metadata: Metadata = buildShowcaseMetadata("en", "uiwwsw");

export default function EnglishShowcasePage() {
  return <ShowcasePageContent locale="en" slug="uiwwsw" />;
}
