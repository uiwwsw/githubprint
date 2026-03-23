import Link from "next/link";
import { getDictionary } from "@/lib/i18n";
import { getShowcasePath, getShowcaseRecord } from "@/lib/showcase";
import type { Locale } from "@/lib/schemas";

export function ShowcaseTeaser({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const showcase = getShowcaseRecord("uiwwsw");
  const showcasePath = getShowcasePath("uiwwsw", locale);

  return (
    <section className="mx-auto mt-6 max-w-4xl rounded-[1.8rem] border border-black/[0.08] bg-white/[0.72] p-5 shadow-[0_24px_64px_-44px_rgba(0,0,0,0.45)] backdrop-blur lg:p-6">
      <div className="grid gap-5 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-center">
        <img
          alt={`${showcase.name} profile`}
          className="h-24 w-24 rounded-[1.6rem] border border-black/[0.08] object-cover shadow-[0_24px_40px_-30px_rgba(0,0,0,0.65)]"
          height="96"
          src={showcase.profileImagePath}
          width="96"
        />
        <div className="space-y-3">
          <p className="text-[11px] uppercase tracking-[0.24em] text-neutral-400">
            {dict.home.showcaseEyebrow}
          </p>
          <h2 className="font-serif text-2xl text-neutral-950">
            {dict.home.showcaseTitle}
          </h2>
          <p className="max-w-3xl text-sm leading-7 text-neutral-600">
            {dict.home.showcaseDescription}
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              showcase.name,
              locale === "ko" ? "실제 Resume 레이아웃" : "Actual Resume layout",
              locale === "ko" ? "공개 resume 레포" : "Public resume repo",
              "React",
              "Next.js",
              "TypeScript",
            ].map((item) => (
              <span
                className="rounded-full border border-black/[0.08] bg-black/[0.025] px-3 py-1.5 text-xs text-neutral-700"
                key={item}
              >
                {item}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              className="inline-flex h-11 items-center justify-center rounded-full bg-neutral-950 px-5 text-sm font-medium text-white shadow-[0_16px_40px_-24px_rgba(0,0,0,0.75)] transition hover:bg-neutral-800"
              href={showcasePath}
            >
              {dict.home.showcaseOpen}
            </Link>
            <a
              className="inline-flex h-11 items-center justify-center rounded-full border border-black/[0.08] bg-white/80 px-5 text-sm font-medium text-neutral-900 transition hover:bg-white"
              href={showcase.resumeRepoUrl}
              rel="noreferrer"
              target="_blank"
            >
              {dict.home.showcaseOpenRepo}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
