import type { Metadata } from "next";
import {
  generateResultPageMetadata,
  ResultPageContent,
  type ResultPageProps,
} from "@/components/pages/result-page-content";

export async function generateMetadata({
  searchParams,
}: ResultPageProps): Promise<Metadata> {
  return generateResultPageMetadata({ locale: "ko", searchParams });
}

export default async function ResultPage({ searchParams }: ResultPageProps) {
  return <ResultPageContent locale="ko" searchParams={searchParams} />;
}
