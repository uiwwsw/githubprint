import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getLocalizedResultPath } from "@/lib/i18n";
import { buildResultMetadata } from "@/lib/seo";
import { templateSchema } from "@/lib/schemas";

export const metadata: Metadata = buildResultMetadata("ko");

type ResultRedirectPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getFirstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ResultPage({ searchParams }: ResultRedirectPageProps) {
  const params = await searchParams;
  const template = templateSchema.safeParse(getFirstValue(params.template));
  const nextParams = new URLSearchParams();
  const privateValue = getFirstValue(params.private);
  const refreshValue = getFirstValue(params.refresh);

  if (privateValue === "1" || privateValue === "true") {
    nextParams.set("private", "1");
  }

  if (refreshValue) {
    nextParams.set("refresh", refreshValue);
  }

  const nextPath = getLocalizedResultPath(
    template.success ? template.data : "profile",
    "ko",
  );
  const query = nextParams.toString();

  redirect(`${nextPath}${query ? `?${query}` : ""}`);
}
