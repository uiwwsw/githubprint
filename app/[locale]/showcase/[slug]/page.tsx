import { notFound, permanentRedirect } from "next/navigation";
import { getShowcasePath } from "@/lib/showcase";
import { localeSchema } from "@/lib/schemas";

type LegacyShowcasePageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export default async function LegacyShowcasePage({
  params,
}: LegacyShowcasePageProps) {
  const resolvedParams = await params;
  const locale = localeSchema.safeParse(resolvedParams.locale);

  if (!locale.success || resolvedParams.slug !== "uiwwsw") {
    notFound();
  }

  permanentRedirect(getShowcasePath("uiwwsw", locale.data));
}
