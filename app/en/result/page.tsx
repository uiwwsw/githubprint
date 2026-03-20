import { redirect } from "next/navigation";
import { getLocalizedResultPath } from "@/lib/i18n";
import { templateSchema } from "@/lib/schemas";

type EnglishResultRedirectPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getFirstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function EnglishResultPage({
  searchParams,
}: EnglishResultRedirectPageProps) {
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
    "en",
  );
  const query = nextParams.toString();

  redirect(`${nextPath}${query ? `?${query}` : ""}`);
}
