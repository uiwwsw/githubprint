"use client";

import { startTransition, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getDictionary, getLocalizedPathname } from "@/lib/i18n";
import { scrollWindowToTopInstantly } from "@/lib/instant-scroll";
import { getTemplateMeta } from "@/lib/templates";
import { type Locale, type TemplateId } from "@/lib/schemas";
import { cn } from "@/lib/utils";

export function SelfGenerator({
  locale,
  username,
}: {
  locale: Locale;
  username: string;
}) {
  const router = useRouter();
  const dict = getDictionary(locale);
  const [includePrivate, setIncludePrivate] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [selectedTemplate, setSelectedTemplate] =
    useState<TemplateId>("profile");

  const templateCards = useMemo(() => {
    const templateMap = getTemplateMeta(locale);
    return (["brief", "profile", "insight"] as TemplateId[]).map((id) => ({
      id,
      ...templateMap[id],
    }));
  }, [locale]);

  function handleGenerate() {
    setIsPending(true);
    const params = new URLSearchParams({
      template: selectedTemplate,
      url: `https://github.com/${username}`,
    });
    if (includePrivate) {
      params.set("private", "1");
    }

    scrollWindowToTopInstantly();
    startTransition(() => {
      router.push(`${getLocalizedPathname("/result", locale)}?${params.toString()}`, {
        scroll: true,
      });
    });
  }

  return (
    <section className="mx-auto mt-6 w-full max-w-4xl rounded-[2rem] border border-black/[0.08] bg-white/[0.72] p-6 shadow-[0_30px_80px_-48px_rgba(0,0,0,0.45)] backdrop-blur xl:p-8">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.24em] text-neutral-400">
              {dict.home.authReadyEyebrow}
            </p>
            <h2 className="font-serif text-2xl text-neutral-950">
              {dict.home.generatorTitle}
            </h2>
            <p className="max-w-2xl text-sm leading-7 text-neutral-600">
              {dict.home.generatorDescription}
            </p>
          </div>

          <label className="flex min-w-[17rem] cursor-pointer items-center justify-between gap-4 rounded-[1.2rem] border border-black/[0.08] bg-black/[0.025] px-4 py-3">
            <div className="space-y-1">
              <p className="text-sm font-medium text-neutral-900">
                {dict.home.privateToggleLabel}
              </p>
              <p className="text-xs leading-5 text-neutral-500">@{username}</p>
            </div>
            <span
              aria-hidden="true"
              className={cn(
                "relative h-7 w-12 rounded-full border transition",
                includePrivate
                  ? "border-neutral-950 bg-neutral-950"
                  : "border-black/[0.08] bg-white",
              )}
            >
              <span
                className={cn(
                  "absolute left-1 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full shadow-sm transition-transform",
                  includePrivate
                    ? "translate-x-5 bg-white"
                    : "translate-x-0 bg-neutral-900",
                )}
              />
            </span>
            <input
              checked={includePrivate}
              className="sr-only"
              onChange={(event) => setIncludePrivate(event.target.checked)}
              type="checkbox"
            />
          </label>
        </div>

        <div
          className={cn(
            "rounded-[1.2rem] border px-4 py-3 text-sm leading-6",
            includePrivate
              ? "border-amber-300/70 bg-amber-50 text-amber-900"
              : "border-black/[0.08] bg-black/[0.025] text-neutral-600",
          )}
        >
          {includePrivate
            ? dict.home.privateToggleWarning
            : dict.home.privateToggleHint}
        </div>
      </div>

      <div className="mt-8 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-neutral-700">
            {dict.home.templateHeading}
          </p>
          <p className="text-sm text-neutral-500">{dict.home.templateHint}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {templateCards.map((template) => {
            const isSelected = template.id === selectedTemplate;

            return (
              <button
                className={cn(
                  "rounded-[1.6rem] border p-5 text-left transition",
                  isSelected
                    ? "border-neutral-950 bg-neutral-950 text-white"
                    : "border-black/[0.08] bg-white/80 text-neutral-900 hover:border-black/[0.15] hover:bg-white",
                )}
                key={template.id}
                onClick={() => setSelectedTemplate(template.id)}
                type="button"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-serif text-2xl">{template.label}</p>
                    <p
                      className={cn(
                        "mt-1 text-sm",
                        isSelected ? "text-white/70" : "text-neutral-500",
                      )}
                    >
                      {template.shortLabel}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs",
                      isSelected
                        ? "border-white/[0.15] bg-white/10 text-white/80"
                        : "border-black/[0.08] bg-neutral-100 text-neutral-600",
                    )}
                  >
                    {isSelected ? dict.home.selected : dict.home.select}
                  </span>
                </div>
                <p
                  className={cn(
                    "mt-6 text-sm leading-6",
                    isSelected ? "text-white/[0.88]" : "text-neutral-700",
                  )}
                >
                  {template.description}
                </p>
                <p
                  className={cn(
                    "mt-4 text-sm leading-6",
                    isSelected ? "text-white/[0.62]" : "text-neutral-500",
                  )}
                >
                  {template.emphasis}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-6 text-neutral-500">
          {dict.home.submitHint}
        </p>
        <Button
          className="w-full sm:w-auto"
          disabled={isPending}
          onClick={handleGenerate}
          size="lg"
          type="button"
        >
          {isPending ? dict.home.submitting : dict.home.submit}
        </Button>
      </div>
    </section>
  );
}
