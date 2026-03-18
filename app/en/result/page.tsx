import type { Metadata } from "next";
import {
  generateResultPageMetadata,
  ResultPageContent,
  type ResultPageProps,
} from "@/components/pages/result-page-content";

export async function generateMetadata({
  searchParams,
}: ResultPageProps): Promise<Metadata> {
  return generateResultPageMetadata({ locale: "en", searchParams });
}

export default async function EnglishResultPage({
  searchParams,
}: ResultPageProps) {
  return <ResultPageContent locale="en" searchParams={searchParams} />;
}
