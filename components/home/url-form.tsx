"use client";

import { startTransition, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getDictionary, getLocalizedPathname } from "@/lib/i18n";
import { normalizeGitHubUrlInput, GitHubUrlError } from "@/lib/github-url";
import { getTemplateMeta } from "@/lib/templates";
import { type Locale, type TemplateId } from "@/lib/schemas";
import { cn } from "@/lib/utils";

export function UrlForm({ locale }: { locale: Locale }) {
  const router = useRouter();
  const dict = getDictionary(locale);
  const [url, setUrl] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>("profile");
  const [error, setError] = useState("");
  const [hasBlurredUrl, setHasBlurredUrl] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const templateCards = useMemo(() => {
    const templateMap = getTemplateMeta(locale);
    return (["brief", "profile", "insight"] as TemplateId[]).map((id) => ({
      id,
      ...templateMap[id],
    }));
  }, [locale]);

  const validation = useMemo(() => {
    if (!url.trim()) {
      return { parsed: null, message: "" };
    }

    try {
      return {
        parsed: normalizeGitHubUrlInput(url, locale),
        message: "",
      };
    } catch (validationError) {
      return {
        parsed: null,
        message:
          validationError instanceof GitHubUrlError
            ? validationError.message
            : locale === "ko"
              ? "URL을 확인한 뒤 다시 시도해 주세요."
              : "Please check the URL and try again.",
      };
    }
  }, [locale, url]);

  const canSubmit = Boolean(validation.parsed) && !isPending;
  const displayError = error || (hasBlurredUrl ? validation.message : "");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      const parsed = validation.parsed ?? normalizeGitHubUrlInput(url, locale);
      setError("");
      setIsPending(true);

      const params = new URLSearchParams({
        template: selectedTemplate,
        url: parsed.canonicalProfileUrl,
      });
      const targetPath = getLocalizedPathname("/result", locale);

      startTransition(() => {
        router.push(`${targetPath}?${params.toString()}`);
      });
    } catch (submissionError) {
      setIsPending(false);
      if (submissionError instanceof GitHubUrlError) {
        setError(submissionError.message);
        return;
      }
      setError(
        locale === "ko"
          ? "URL을 확인한 뒤 다시 시도해 주세요."
          : "Please check the URL and try again.",
      );
    }
  }

  return (
    <form
      autoComplete="off"
      className="mx-auto w-full max-w-4xl rounded-[2rem] border border-black/[0.08] bg-white/[0.72] p-6 shadow-[0_30px_80px_-48px_rgba(0,0,0,0.45)] backdrop-blur xl:p-8"
      onSubmit={handleSubmit}
    >
      <div className="space-y-3">
        <label
          className="block text-sm font-medium text-neutral-700"
          htmlFor="gitfolio-profile-url-input"
        >
          {dict.home.urlLabel}
        </label>
        <Input
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          data-1p-ignore="true"
          data-bwignore="true"
          data-form-type="other"
          data-lpignore="true"
          id="gitfolio-profile-url-input"
          inputMode="text"
          name="gitfolioProfileUrl"
          onBlur={() => {
            setHasBlurredUrl(true);
          }}
          onChange={(event) => {
            setUrl(event.target.value);
            if (error) {
              setError("");
            }
          }}
          placeholder={dict.home.urlPlaceholder}
          spellCheck={false}
          type="text"
          value={url}
        />
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-neutral-500">
          <p>{dict.home.urlHintPrimary}</p>
          <p>{dict.home.urlHintSecondary}</p>
        </div>
        {displayError ? <p className="text-sm text-red-600">{displayError}</p> : null}
      </div>

      <div className="mt-8 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-neutral-700">{dict.home.templateHeading}</p>
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
        <p className="text-sm leading-6 text-neutral-500">{dict.home.submitHint}</p>
        <Button className="w-full sm:w-auto" disabled={!canSubmit} size="lg" type="submit">
          {isPending ? dict.home.submitting : dict.home.submit}
        </Button>
      </div>
    </form>
  );
}
