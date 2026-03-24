"use client";

import { startTransition, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ResumeActivationPanel } from "@/components/resume/resume-activation-panel";
import { Button } from "@/components/ui/button";
import { getDictionary, getLocalizedResultPath } from "@/lib/i18n";
import { scheduleWindowTopScroll } from "@/lib/instant-scroll";
import { getResumeCopy } from "@/lib/resume-copy";
import type { ResumeTemplateAvailability } from "@/lib/resume";
import {
  parseStoredPrivatePreference,
  parseStoredTemplatePreference,
  SELF_GENERATOR_PRIVATE_KEY,
  SELF_GENERATOR_TEMPLATE_KEY,
} from "@/lib/self-generator-preferences";
import { getTemplateMeta } from "@/lib/templates";
import { type Locale, type TemplateId } from "@/lib/schemas";
import { cn } from "@/lib/utils";

function readStoredTemplate() {
  try {
    return parseStoredTemplatePreference(
      window.localStorage.getItem(SELF_GENERATOR_TEMPLATE_KEY),
    );
  } catch {
    // localStorage is best-effort only.
  }

  return null;
}

function readStoredPrivateToggle() {
  try {
    return parseStoredPrivatePreference(
      window.localStorage.getItem(SELF_GENERATOR_PRIVATE_KEY),
    );
  } catch {
    // localStorage is best-effort only.
  }

  return null;
}

function storeTemplatePreference(template: TemplateId) {
  try {
    window.localStorage.setItem(SELF_GENERATOR_TEMPLATE_KEY, template);
  } catch {
    // localStorage is best-effort only.
  }
}

function storePrivatePreference(includePrivate: boolean) {
  try {
    window.localStorage.setItem(
      SELF_GENERATOR_PRIVATE_KEY,
      includePrivate ? "1" : "0",
    );
  } catch {
    // localStorage is best-effort only.
  }
}

function storeTemplateCookie(template: TemplateId) {
  try {
    document.cookie = `${SELF_GENERATOR_TEMPLATE_KEY}=${encodeURIComponent(template)}; Max-Age=31536000; Path=/; SameSite=Lax`;
  } catch {
    // Cookie persistence is best-effort only.
  }
}

function storePrivateCookie(includePrivate: boolean) {
  try {
    document.cookie = `${SELF_GENERATOR_PRIVATE_KEY}=${includePrivate ? "1" : "0"}; Max-Age=31536000; Path=/; SameSite=Lax`;
  } catch {
    // Cookie persistence is best-effort only.
  }
}

function sanitizeTemplateSelection(
  template: TemplateId,
  resumeAvailability: ResumeTemplateAvailability | null,
) {
  if (template === "resume" && resumeAvailability?.state !== "ready") {
    return "profile" satisfies TemplateId;
  }

  return template;
}

export function SelfGenerator({
  hasStoredPreferences,
  initialIncludePrivate,
  initialTemplate,
  locale,
  resumeAvailability,
  username,
}: {
  hasStoredPreferences: boolean;
  initialIncludePrivate: boolean;
  initialTemplate: TemplateId;
  locale: Locale;
  resumeAvailability: ResumeTemplateAvailability | null;
  username: string;
}) {
  const router = useRouter();
  const dict = getDictionary(locale);
  const resumeCopy = getResumeCopy(locale);
  const [includePrivate, setIncludePrivate] = useState(initialIncludePrivate);
  const [isPending, setIsPending] = useState(false);
  const [selectedTemplate, setSelectedTemplate] =
    useState<TemplateId>(
      sanitizeTemplateSelection(initialTemplate, resumeAvailability),
    );
  const [isPreferenceReady, setIsPreferenceReady] =
    useState(hasStoredPreferences);
  const [isResumeGuideOpen, setIsResumeGuideOpen] = useState(false);

  useEffect(() => {
    const safeInitialTemplate = sanitizeTemplateSelection(
      initialTemplate,
      resumeAvailability,
    );

    if (hasStoredPreferences) {
      storeTemplatePreference(safeInitialTemplate);
      storePrivatePreference(initialIncludePrivate);
      return;
    }

    const storedTemplate = sanitizeTemplateSelection(
      readStoredTemplate() ?? safeInitialTemplate,
      resumeAvailability,
    );
    const storedPrivate = readStoredPrivateToggle() ?? initialIncludePrivate;

    setSelectedTemplate(storedTemplate);
    setIncludePrivate(storedPrivate);
    storeTemplatePreference(storedTemplate);
    storePrivatePreference(storedPrivate);
    storeTemplateCookie(storedTemplate);
    storePrivateCookie(storedPrivate);
    setIsPreferenceReady(true);
  }, [
    hasStoredPreferences,
    initialIncludePrivate,
    initialTemplate,
    resumeAvailability,
  ]);

  useEffect(() => {
    if (!hasStoredPreferences) {
      return;
    }

    const safeInitialTemplate = sanitizeTemplateSelection(
      initialTemplate,
      resumeAvailability,
    );
    setSelectedTemplate(safeInitialTemplate);
    storeTemplateCookie(safeInitialTemplate);
    storePrivateCookie(initialIncludePrivate);
  }, [
    hasStoredPreferences,
    initialIncludePrivate,
    initialTemplate,
    resumeAvailability,
  ]);

  const templateCards = useMemo(() => {
    const templateMap = getTemplateMeta(locale);
    return (["brief", "profile", "insight", "resume"] as TemplateId[]).map(
      (id) => ({
        id,
        resumeState: id === "resume" ? resumeAvailability?.state ?? "locked_missing_repo" : null,
        ...templateMap[id],
      }),
    );
  }, [locale, resumeAvailability]);
  const selectedTemplateMeta =
    templateCards.find((template) => template.id === selectedTemplate) ??
    templateCards[0];

  function getResumeStatus(
    state: ResumeTemplateAvailability["state"] | null | undefined,
  ) {
    if (state === "locked_invalid_schema") {
      return resumeCopy.card.lockedInvalid;
    }

    if (state === "ready") {
      return resumeCopy.card.ready;
    }

    return resumeCopy.card.lockedMissing;
  }

  const selectedResumeStatus =
    selectedTemplateMeta?.id === "resume"
      ? getResumeStatus(selectedTemplateMeta.resumeState)
      : null;

  function handleGenerate() {
    setIsPending(true);
    const params = new URLSearchParams({
      template: selectedTemplate,
    });
    if (includePrivate) {
      params.set("private", "1");
    }

    startTransition(() => {
      const query = params.toString();
      const resultPath = getLocalizedResultPath(selectedTemplate, locale);
      scheduleWindowTopScroll();
      router.push(`${resultPath}${query ? `?${query}` : ""}`, {
        scroll: false,
      });
    });
  }

  function handleTemplateSelect(template: TemplateId) {
    if (template === "resume" && resumeAvailability?.state !== "ready") {
      setIsResumeGuideOpen(true);
      return;
    }

    setIsResumeGuideOpen(false);
    setSelectedTemplate(template);
    storeTemplatePreference(template);
    storeTemplateCookie(template);
  }

  function handlePrivateToggle(nextValue: boolean) {
    setIncludePrivate(nextValue);
    storePrivatePreference(nextValue);
    storePrivateCookie(nextValue);
  }

  return (
    <section
      aria-hidden={!isPreferenceReady}
      className={cn(
        "mx-auto mt-6 w-full max-w-4xl rounded-[2rem] border border-black/[0.08] bg-white/[0.72] p-6 shadow-[0_30px_80px_-48px_rgba(0,0,0,0.45)] backdrop-blur xl:p-8",
        !isPreferenceReady && "invisible",
      )}
    >
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
              onChange={(event) => handlePrivateToggle(event.target.checked)}
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
        <div className="space-y-2">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-baseline lg:justify-between lg:gap-8">
            <p className="text-sm font-medium text-neutral-700">
              {dict.home.templateHeading}
            </p>
            <p className="max-w-2xl text-sm leading-6 text-neutral-500">
              {dict.home.templateHint}
            </p>
          </div>
          <p className="text-sm leading-6 text-neutral-500">
            {resumeCopy.card.activationHint}
          </p>
        </div>
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.95fr)]">
          <div className="grid gap-4 md:grid-cols-2">
            {templateCards.map((template) => {
              const isSelected = template.id === selectedTemplate;
              const isResumeTemplate = template.id === "resume";
              const isResumeLocked =
                isResumeTemplate && template.resumeState !== "ready";
              const resumeStatus =
                isResumeTemplate
                  ? getResumeStatus(template.resumeState)
                  : null;

              return (
                <button
                  className={cn(
                    "flex h-full min-h-[13.5rem] flex-col rounded-[1.6rem] border p-5 text-left transition",
                    isSelected && isResumeTemplate
                      ? "border-emerald-700 bg-[linear-gradient(180deg,rgba(236,253,245,0.98),rgba(209,250,229,0.94))] text-emerald-950 shadow-[0_20px_44px_-30px_rgba(6,95,70,0.45)]"
                      : isSelected
                      ? "border-neutral-950 bg-neutral-950/[0.04] text-neutral-950 shadow-[0_18px_40px_-30px_rgba(0,0,0,0.45)]"
                      : isResumeLocked
                        ? "border-amber-300/70 bg-amber-50/80 text-neutral-900 hover:border-amber-400"
                        : isResumeTemplate
                          ? "border-emerald-200 bg-emerald-50/75 text-emerald-950 hover:border-emerald-300 hover:bg-emerald-50"
                        : "border-black/[0.08] bg-white/80 text-neutral-900 hover:border-black/[0.15] hover:bg-white",
                  )}
                  key={template.id}
                  onClick={() => handleTemplateSelect(template.id)}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-serif text-2xl">{template.label}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <p
                          className={cn(
                            "text-sm",
                            isResumeTemplate ? "text-emerald-700" : "text-neutral-500",
                          )}
                        >
                          {template.shortLabel}
                        </p>
                        {isResumeTemplate ? (
                          <span className="rounded-full border border-emerald-200 bg-white/85 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-emerald-700">
                            {dict.home.resumeTemplateBadge}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <span
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs",
                        isSelected && isResumeTemplate
                          ? "border-emerald-800 bg-emerald-900 text-emerald-50"
                          : isSelected
                            ? "border-neutral-950/10 bg-neutral-950 text-white"
                            : isResumeTemplate
                              ? "border-emerald-200 bg-white/85 text-emerald-700"
                              : "border-black/[0.08] bg-neutral-100 text-neutral-600",
                      )}
                    >
                      {isSelected ? dict.home.selected : dict.home.select}
                    </span>
                  </div>
                  <p
                    className={cn(
                      "mt-5 max-w-[28ch] text-sm leading-6",
                      isResumeTemplate ? "text-emerald-900/85" : "text-neutral-700",
                    )}
                  >
                    {template.description}
                  </p>
                  {resumeStatus ? (
                    <div className="mt-auto pt-5">
                      <span
                        className={cn(
                          "inline-flex rounded-full border px-3 py-1 text-xs font-medium",
                          template.resumeState === "ready"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-amber-200 bg-amber-100/80 text-amber-800",
                        )}
                      >
                        {resumeStatus}
                      </span>
                    </div>
                  ) : null}
                </button>
              );
            })}
          </div>

          {selectedTemplateMeta ? (
            <aside
              className={cn(
                "flex h-full flex-col rounded-[1.8rem] border p-6 text-white shadow-[0_26px_70px_-46px_rgba(0,0,0,0.7)]",
                selectedTemplateMeta.id === "resume"
                  ? "border-emerald-950 bg-[linear-gradient(145deg,rgba(2,44,34,1),rgba(6,78,59,1)_58%,rgba(2,44,34,1))]"
                  : "border-neutral-950 bg-neutral-950",
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-serif text-[clamp(2.1rem,4vw,2.8rem)] leading-none">
                    {selectedTemplateMeta.label}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <p className="text-base text-white/72">
                      {selectedTemplateMeta.shortLabel}
                    </p>
                    {selectedTemplateMeta.id === "resume" ? (
                      <span className="rounded-full border border-emerald-200/30 bg-white/10 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-emerald-100">
                        {dict.home.resumeTemplateBadge}
                      </span>
                    ) : null}
                  </div>
                </div>
                <span className="rounded-full border border-white/[0.15] bg-white/10 px-3 py-1 text-xs text-white/80">
                  {dict.home.selected}
                </span>
              </div>

              <p className="mt-6 text-base leading-8 text-white/[0.9]">
                {selectedTemplateMeta.description}
              </p>

              <div className="mt-6 rounded-[1.3rem] border border-white/[0.12] bg-white/[0.04] p-4">
                <p className="text-sm leading-7 text-white/[0.74]">
                  {selectedTemplateMeta.emphasis}
                </p>

                {selectedResumeStatus ? (
                  <div className="mt-4 border-t border-white/[0.12] pt-4">
                    <p className="text-sm leading-7 text-white/[0.62]">
                      {resumeCopy.card.activationHint}
                    </p>
                    <p
                      className={cn(
                        "mt-3 text-sm font-medium",
                        selectedTemplateMeta.resumeState === "ready"
                          ? "text-emerald-300"
                          : "text-amber-200",
                      )}
                    >
                      {selectedResumeStatus}
                    </p>
                  </div>
                ) : null}
              </div>
            </aside>
          ) : null}
        </div>
        {isResumeGuideOpen && resumeAvailability ? (
          <ResumeActivationPanel
            availability={resumeAvailability}
            locale={locale}
            onClose={() => setIsResumeGuideOpen(false)}
          />
        ) : null}
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
