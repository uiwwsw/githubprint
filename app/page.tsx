import type { Metadata } from "next";
import { HomePageContent } from "@/components/pages/home-page-content";
import { buildHomeMetadata } from "@/lib/seo";

export function generateMetadata(): Metadata {
  return buildHomeMetadata("ko");
}

export default function HomePage() {
  return <HomePageContent locale="ko" />;
}
