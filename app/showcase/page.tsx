import type { Metadata } from "next";
import { ShowcasePageContent } from "@/components/pages/showcase-page-content";
import { buildShowcaseMetadata } from "@/lib/seo";

export const revalidate = 86400;
export const metadata: Metadata = buildShowcaseMetadata("ko", "uiwwsw");

export default function ShowcasePage() {
  return <ShowcasePageContent locale="ko" slug="uiwwsw" />;
}
