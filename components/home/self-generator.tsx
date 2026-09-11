"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TemplatePreview } from "@/components/home/template-preview";
import { ResumeActivationPanel } from "@/components/resume/resume-activation-panel";
import { Button } from "@/components/ui/button";
import {
  defaultDocumentOptions,
  MAX_PRIVATE_REPOS,
  needsPrivatePermission,
  type DocumentOptions,
} from "@/lib/document-options";
import { getDictionary } from "@/lib/i18n";
import { SELF_GENERATOR_TEMPLATE_KEY } from "@/lib/self-generator-preferences";
import { getTemplateMeta } from "@/lib/templates";
import type { Locale, TemplateId } from "@/lib/schemas";
import { cn } from "@/lib/utils";
import type { ResumeReadiness } from "@/lib/resume-readiness";

type RepoChoice = { name: string; archived: boolean };

export function SelfGenerator({
  canReadPrivate,
  initialTemplate,
  initialOptions,
  resumeOnly = false,
  locale,
  privateLoginHref,
  loginHref,
  username,
}: {
  canReadPrivate: boolean;
  initialTemplate: TemplateId;
  initialOptions?: DocumentOptions;
  resumeOnly?: boolean;
  locale: Locale;
  privateLoginHref: string;
  loginHref: string;
  username: string;
}) {
  const router = useRouter();
  const dict = getDictionary(locale);
  const ko = locale === "ko";
  const t = (kr: string, en: string) => (ko ? kr : en);
  const submitLabel = resumeOnly
    ? t("이력서 다시 불러오기", "Load resume again")
    : dict.home.submit;
  const [options, setOptions] = useState<DocumentOptions>(
    initialOptions ??
      defaultDocumentOptions(resumeOnly ? "resume" : initialTemplate),
  );
  const [repositories, setRepositories] = useState<RepoChoice[] | null>(null);
  const [repoError, setRepoError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [showGuide, setShowGuide] = useState(false);
  const [readiness, setReadiness] = useState<{
    source: string;
    result: ResumeReadiness;
  } | null>(null);
  const [sourceRetry, setSourceRetry] = useState(0);
  const resume = options.template === "resume";
  const privateAnalysis = !resume && options.analysisScope !== "public";
  const needsPermission = needsPrivatePermission(options);
  const storageKey = `githubprint:pending-configuration:${username.toLowerCase()}`;

  useEffect(() => {
    // Restore only an explicit permission-upgrade round trip; old private toggles are never consent.
    try {
      const saved = sessionStorage.getItem(storageKey);
      sessionStorage.removeItem(storageKey);
      if (saved) {
        const value = JSON.parse(saved);
        if (
          Date.now() - value.savedAt < 600_000 &&
          (!resumeOnly || value.options?.template === "resume") &&
          ["brief", "profile", "insight", "resume"].includes(
            value.options?.template,
          )
        ) {
          setOptions({
            ...defaultDocumentOptions(value.options.template),
            ...value.options,
          });
        }
      }
    } catch {
      /* An unavailable draft leaves the public default in place. */
    }
  }, [storageKey, resumeOnly]);

  useEffect(() => {
    setReadiness(null);
    if (!resume) return;
    if (options.resumeSource === "authorized" && !canReadPrivate) {
      setReadiness({
        source: options.resumeSource,
        result: { state: "permission" },
      });
      return;
    }
    const controller = new AbortController();
    fetch("/api/resume-readiness", {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: options.resumeSource, locale }),
      signal: AbortSignal.any([controller.signal, AbortSignal.timeout(20_000)]),
    })
      .then(async (response) => {
        const result = await response.json();
        if (!controller.signal.aborted)
          setReadiness({
            source: options.resumeSource,
            result: result.state ? result : { state: "unavailable" },
          });
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setReadiness({
            source: options.resumeSource,
            result: { state: "unavailable" },
          });
      });
    return () => controller.abort();
  }, [resume, options.resumeSource, canReadPrivate, locale, sourceRetry]);

  useEffect(() => {
    if (showGuide && resume)
      document
        .getElementById("resume-setup-guide")
        ?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [showGuide, resume]);

  function rememberSelection() {
    try {
      sessionStorage.setItem(
        storageKey,
        JSON.stringify({ options, savedAt: Date.now() }),
      );
    } catch {
      /* optional draft */
    }
  }
  const sourceState =
    readiness?.source === options.resumeSource ? readiness.result.state : null;
  useEffect(() => {
    if (sourceState === "ready") setShowGuide(false);
  }, [sourceState]);

  useEffect(() => {
    if (!privateAnalysis || !canReadPrivate) return;
    const controller = new AbortController();
    setRepoError(false);
    setRepositories(null);
    fetch("/api/github/private-repos", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("repositories");
        const data = await response.json();
        setRepositories(data.repositories);
        setOptions((current) => ({
          ...current,
          privateRepos: current.privateRepos.filter((name) =>
            data.repositories.some(
              (repo: RepoChoice) =>
                repo.name.toLowerCase() === name.toLowerCase(),
            ),
          ),
        }));
      })
      .catch(() => {
        if (!controller.signal.aborted) setRepoError(true);
      });
    return () => controller.abort();
  }, [privateAnalysis, canReadPrivate, retry]);

  function selectTemplate(template: TemplateId) {
    setShowGuide(false);
    setOptions((current) => ({ ...current, template }));
    setError("");
    try {
      document.cookie = `${SELF_GENERATOR_TEMPLATE_KEY}=${template}; Max-Age=31536000; Path=/; SameSite=Lax`;
    } catch {
      /* optional preference */
    }
  }

  async function generate() {
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/document-configuration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ options, locale }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (data.error === "authentication" || data.error === "permission") {
          rememberSelection();
          window.location.assign(
            needsPermission ? privateLoginHref : loginHref,
          );
          return;
        }
        throw new Error("configuration");
      }
      router.push(data.url);
    } catch {
      setError(
        t(
          "설정을 저장하지 못했습니다. 로그인과 접근 권한을 확인한 뒤 다시 시도해 주세요.",
          "Could not save this configuration. Check your sign-in and access, then try again.",
        ),
      );
      setPending(false);
    }
  }

  const choices = [
    {
      value: "public" as const,
      title: t("공개 자료만", "Public only"),
      text: t(
        "공개 포트폴리오와 외부 공유에 적합합니다. 비공개 저장소는 읽지 않습니다.",
        "For a public portfolio or external sharing. Private repositories are not read.",
      ),
    },
    {
      value: "private-summary" as const,
      title: t("비공개 작업 익명 요약", "Summarize private work"),
      text: t(
        "공개 활동이 적을 때 선택한 작업의 기술·문서·테스트·자동화 흔적을 보완합니다. 이름·링크·설명은 제외합니다.",
        "Fill gaps in public activity with technology, documentation, testing, and automation signals from selected work. Names, links, and descriptions are excluded.",
      ),
    },
    {
      value: "private-details" as const,
      title: t("비공개 프로젝트 상세 포함", "Include private project details"),
      text: t(
        "내부 검토나 공개 가능한 프로젝트 소개에 적합합니다. 선택한 저장소의 이름·설명·링크가 파일에 들어갑니다.",
        "For internal reviews or work you may disclose. Selected repository names, descriptions, and links appear in the files.",
      ),
    },
  ];
  const purpose = {
    brief: t(
      "첫 소개에 필요한 기술과 대표작을 간결하게.",
      "A concise introduction through your stack and selected work.",
    ),
    profile: t(
      "무엇을 만들었는지, 프로젝트로 보여주는 포트폴리오.",
      "A portfolio that puts the projects you built first.",
    ),
    insight: t(
      "프로젝트에서 반복되는 기술 선택과 작업 패턴을 살펴보세요.",
      "Explore the technical choices and patterns across your projects.",
    ),
    resume: t(
      "작성해 둔 이력서를 읽기 좋은 문서로 정리합니다.",
      "Turn your authored resume into a well-formatted document.",
    ),
  };

  return (
    <section
      id="generator"
      className="mx-auto my-10 max-w-5xl scroll-mt-8 rounded-3xl border border-black/10 bg-white p-5 shadow-sm sm:p-8"
    >
      <p className="studio-eyebrow">YOUR DOCUMENT / @{username}</p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight">
        {resumeOnly
          ? t("기존 이력서 연결", "Connect your existing resume")
          : t("어떤 문서를 만들까요?", "What would you like to make?")}
      </h2>
      {!resumeOnly && (
        <div
          className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4"
          aria-label={t("문서 템플릿", "Document template")}
        >
          {(["brief", "profile", "insight", "resume"] as TemplateId[]).map(
            (id) => (
              <button
                type="button"
                key={id}
                aria-pressed={options.template === id}
                onClick={() => selectTemplate(id)}
                className={cn(
                  "rounded-2xl border p-4 text-left transition",
                  options.template === id
                    ? "border-emerald-800 bg-emerald-950 text-white"
                    : "border-black/10 hover:bg-neutral-50",
                )}
              >
                <span className="block font-serif text-2xl">
                  {getTemplateMeta(locale)[id].label}
                </span>
                <span
                  className={cn(
                    "mt-2 block text-xs leading-5",
                    options.template === id
                      ? "text-emerald-100"
                      : "text-neutral-500",
                  )}
                >
                  {getTemplateMeta(locale)[id].shortLabel}
                </span>
              </button>
            ),
          )}
        </div>
      )}
      <p className="my-6 text-sm leading-7 text-neutral-600">
        {purpose[options.template]}
      </p>
      <div className="grid items-start gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-5">
          {resume ? (
            <>
              <fieldset className="resume-source-picker">
                <legend>
                  {t("이력서가 있는 저장소", "Your resume repository")}
                </legend>
                <p className="source-location">github.com/{username}/resume</p>
                <div className="source-options">
                  {(["public", "authorized"] as const).map((value) => (
                    <label
                      key={value}
                      data-selected={options.resumeSource === value}
                    >
                      <input
                        type="radio"
                        name="resume-source"
                        checked={options.resumeSource === value}
                        onChange={() =>
                          setOptions({ ...options, resumeSource: value })
                        }
                      />
                      <span>
                        {value === "public"
                          ? t("공개 저장소", "Public repository")
                          : t("비공개 저장소", "Private repository")}
                      </span>
                    </label>
                  ))}
                </div>
                <p className="source-caption">
                  {t(
                    "작성한 경력·프로젝트·연락처를 그대로 담습니다.",
                    "Your experience, projects, and contact details stay as written.",
                  )}
                </p>
              </fieldset>
              <details className="generator-extra">
                <summary>
                  <span>{t("프로젝트 정보 추가", "Add project details")}</span>
                  <span>
                    {options.resumeProjects === "authorized"
                      ? t("사용 중", "On")
                      : t("선택 사항", "Optional")}
                  </span>
                </summary>
                <p>
                  {t(
                    "기본으로 작성한 내용과 공개 프로젝트 정보를 사용합니다. 비공개 프로젝트의 기술·설명도 가져오려면 켜세요.",
                    "Your own text and public project details are included by default. Turn this on to also add details from private projects.",
                  )}
                </p>
                <label className="flex cursor-pointer items-start gap-3 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1 accent-emerald-800"
                    checked={options.resumeProjects === "authorized"}
                    onChange={(event) =>
                      setOptions({
                        ...options,
                        resumeProjects: event.target.checked
                          ? "authorized"
                          : "public",
                      })
                    }
                  />
                  <span>
                    {t(
                      "연결한 비공개 프로젝트 정보도 가져오기",
                      "Include linked private project details",
                    )}
                  </span>
                </label>
                <p className="text-xs">
                  {t(
                    "이력서에 직접 연결한 프로젝트만 읽습니다. 해당 프로젝트의 이름·설명·링크가 저장 파일에 포함됩니다.",
                    "Only projects linked in your resume are read. Their names, descriptions, and links will appear in saved files.",
                  )}
                </p>
              </details>
            </>
          ) : (
            <fieldset className="space-y-3">
              <legend className="mb-3 text-sm font-semibold">
                {t("사용할 자료 범위", "Sources to use")}
              </legend>
              {choices.map((choice) => (
                <label
                  key={choice.value}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-2xl border p-4",
                    options.analysisScope === choice.value
                      ? "border-emerald-700 bg-emerald-50/70"
                      : "border-black/10",
                  )}
                >
                  <input
                    type="radio"
                    name="analysis-scope"
                    className="mt-1 accent-emerald-800"
                    checked={options.analysisScope === choice.value}
                    onChange={() =>
                      setOptions({ ...options, analysisScope: choice.value })
                    }
                  />
                  <span>
                    <span className="block text-sm font-medium">
                      {choice.title}
                    </span>
                    <span className="mt-1 block text-xs leading-6 text-neutral-600">
                      {choice.text}
                    </span>
                  </span>
                </label>
              ))}
            </fieldset>
          )}
          {needsPermission && !canReadPrivate ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <h3 className="text-sm font-semibold">
                {t(
                  "비공개 접근 권한 연결",
                  "Connect private repository access",
                )}
              </h3>
              <p className="mt-2 text-xs leading-6 text-amber-950">
                {t(
                  "GitHub는 비공개 저장소의 읽기·쓰기 권한을 함께 요청합니다. GitHubPrint는 선택한 자료를 읽기만 합니다.",
                  "GitHub requests both read and write permission for private repositories. GitHubPrint only reads the sources you select.",
                )}
              </p>
              <a
                href={privateLoginHref}
                onClick={() => {
                  try {
                    sessionStorage.setItem(
                      storageKey,
                      JSON.stringify({ options, savedAt: Date.now() }),
                    );
                  } catch {
                    /* optional draft */
                  }
                }}
                className="mt-4 inline-flex rounded-lg bg-amber-950 px-4 py-2 text-sm text-white"
              >
                {t("GitHub에서 권한 연결", "Connect access on GitHub")} ↗
              </a>
            </div>
          ) : null}
          {resume &&
          !(options.resumeSource === "authorized" && !canReadPrivate) ? (
            <div
              className={cn(
                "rounded-2xl border p-5 text-sm leading-6",
                sourceState === "ready"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-950"
                  : "border-black/10 bg-neutral-50 text-neutral-700",
              )}
              aria-live="polite"
            >
              <p className="font-semibold">
                {sourceState === "ready"
                  ? t("이력서 원본 확인 완료", "Resume source verified")
                  : !sourceState
                    ? t("이력서 원본 확인 중…", "Checking your resume source…")
                    : t("원본을 확인해 주세요", "Check your resume source")}
              </p>
              <p className="mt-2">
                {sourceState === "ready"
                  ? t(
                      "준비됐습니다. 문서를 열어 내용을 확인해 보세요.",
                      "Ready. Open your document to review it.",
                    )
                  : sourceState === "missing_repo"
                    ? options.resumeSource === "public"
                      ? t(
                          "공개 이력서를 찾지 못했습니다. 저장소가 비공개라면 위에서 ‘비공개 저장소’를 선택하세요.",
                          "No public resume was found. If yours is private, select ‘Private repository’ above.",
                        )
                      : t(
                          "연결한 계정에서 resume 저장소를 찾지 못했거나 접근할 수 없습니다. 저장소 이름·소유 계정과 GitHub의 앱 접근 설정을 확인하세요.",
                          "The connected account’s resume repository was not found or is inaccessible. Check its name, owner, and app access on GitHub.",
                        )
                    : sourceState === "invalid_schema"
                      ? t(
                          "저장소에 접근했습니다. resume.yaml 파일이나 그 내용을 수정해야 합니다. 권한을 다시 연결할 필요는 없습니다.",
                          "Repository access works. Fix resume.yaml or its contents; reconnecting permissions will not fix this.",
                        )
                      : sourceState === "authentication"
                        ? t(
                            "GitHub 로그인이 만료되었거나 취소되었습니다. 다시 로그인한 뒤 원본을 확인하세요.",
                            "GitHub sign-in expired or was revoked. Sign in again, then check the source.",
                          )
                        : sourceState === "permission"
                          ? t(
                              "GitHub가 원본 읽기를 허용하지 않았습니다. 저장소의 앱 접근 권한을 확인한 뒤 다시 연결하세요.",
                              "GitHub denied source access. Check the repository’s app permissions, then reconnect.",
                            )
                          : sourceState === "rate_limited"
                            ? t(
                                "GitHub 요청 한도에 도달했습니다. 잠시 기다렸다가 다시 확인하세요. 재연결은 필요하지 않습니다.",
                                "GitHub’s request limit was reached. Wait before checking again; reconnecting is unnecessary.",
                              )
                            : sourceState === "unavailable"
                              ? t(
                                  "GitHub 응답을 받지 못했습니다. 잠시 후 원본을 다시 확인하세요.",
                                  "GitHub did not respond. Check the source again shortly.",
                                )
                              : t(
                                  "선택한 접근 범위에서 resume.yaml을 읽을 수 있는지 확인합니다.",
                                  "Checking resume.yaml using the source access you selected.",
                                )}
              </p>
              {sourceState === "invalid_schema" && readiness?.result.detail ? (
                <p className="mt-2 break-words text-xs">
                  {readiness.result.detail}
                </p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs">
                {sourceState ? (
                  <button
                    type="button"
                    className="underline underline-offset-4"
                    onClick={() => setSourceRetry((value) => value + 1)}
                  >
                    {t("원본 다시 확인", "Check source again")}
                  </button>
                ) : null}
                {sourceState === "authentication" ||
                sourceState === "permission" ? (
                  <a
                    href={needsPermission ? privateLoginHref : loginHref}
                    onClick={rememberSelection}
                    className="underline underline-offset-4"
                  >
                    {t("GitHub 연결 다시 하기", "Reconnect GitHub")}
                  </a>
                ) : null}
                {sourceState === "missing_repo" ||
                sourceState === "invalid_schema" ? (
                  <>
                    <a
                      href={`https://github.com/${username}/resume`}
                      target="_blank"
                      rel="noreferrer"
                      className="underline underline-offset-4"
                    >
                      {t("GitHub에서 원본 확인", "Open source on GitHub")}
                    </a>
                    <button
                      type="button"
                      className="underline underline-offset-4"
                      aria-expanded={showGuide}
                      onClick={() => setShowGuide(!showGuide)}
                    >
                      {t("resume.yaml 준비 방법", "How to prepare resume.yaml")}
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          ) : null}
          {privateAnalysis && canReadPrivate ? (
            <div className="rounded-2xl border border-black/10 p-5">
              <h3 className="text-sm font-semibold">
                {t(
                  "분석할 비공개 저장소 선택",
                  "Select private repositories to analyze",
                )}{" "}
                <span className="text-neutral-500">
                  {options.privateRepos.length}/{MAX_PRIVATE_REPOS}
                </span>
              </h3>
              <p className="mt-2 text-xs leading-6 text-neutral-500">
                {t(
                  "선택을 위해 본인 소유 비공개 저장소 이름 목록을 불러옵니다. 내용은 선택한 저장소만 읽습니다.",
                  "Load names of your owned private repositories for selection. Only selected repositories have their contents read.",
                )}
              </p>
              {repoError ? (
                <p role="alert" className="mt-3 text-sm">
                  {t("목록을 읽지 못했습니다.", "Could not load repositories.")}{" "}
                  <button
                    type="button"
                    className="underline"
                    onClick={() => setRetry(retry + 1)}
                  >
                    {t("다시 시도", "Retry")}
                  </button>
                  {" · "}
                  <a
                    href={privateLoginHref}
                    onClick={rememberSelection}
                    className="underline"
                  >
                    {t("GitHub 연결 확인", "Check GitHub access")}
                  </a>
                </p>
              ) : repositories === null ? (
                <p role="status" className="mt-3 text-sm">
                  {t("목록 불러오는 중…", "Loading repositories…")}
                </p>
              ) : repositories.length === 0 ? (
                <p className="mt-3 text-sm">
                  {t(
                    "접근 가능한 본인 소유 비공개 저장소가 없습니다. 공개 자료만 사용하거나 GitHub 권한을 확인하세요.",
                    "No accessible owned private repositories. Use public sources or check your GitHub access.",
                  )}
                </p>
              ) : (
                <>
                  <input
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    aria-label={t("저장소 검색", "Search repositories")}
                    placeholder={t("저장소 검색", "Search repositories")}
                    className="mt-3 w-full rounded-lg border border-black/15 px-3 py-2 text-sm"
                  />
                  {options.privateRepos.length ? (
                    <p className="mt-3 break-all text-xs leading-6 text-emerald-900">
                      {t("선택됨: ", "Selected: ")}
                      {options.privateRepos.join(", ")}
                    </p>
                  ) : null}
                  <div className="mt-3 max-h-56 space-y-1 overflow-y-auto">
                    {repositories
                      .filter((repo) =>
                        repo.name.toLowerCase().includes(query.toLowerCase()),
                      )
                      .map((repo) => {
                        const selected = options.privateRepos.includes(
                          repo.name.toLowerCase(),
                        );
                        return (
                          <label
                            key={repo.name}
                            className="flex cursor-pointer items-start gap-3 rounded-lg p-2 text-sm hover:bg-neutral-50"
                          >
                            <input
                              className="mt-1 accent-emerald-800"
                              type="checkbox"
                              checked={selected}
                              disabled={
                                !selected &&
                                options.privateRepos.length >= MAX_PRIVATE_REPOS
                              }
                              onChange={() =>
                                setOptions({
                                  ...options,
                                  privateRepos: selected
                                    ? options.privateRepos.filter(
                                        (name) =>
                                          name !== repo.name.toLowerCase(),
                                      )
                                    : [
                                        ...options.privateRepos,
                                        repo.name.toLowerCase(),
                                      ],
                                })
                              }
                            />
                            <span className="min-w-0 break-all">
                              {repo.name}
                              {repo.archived ? (
                                <span className="ml-2 text-xs text-neutral-500">
                                  Archived
                                </span>
                              ) : null}
                            </span>
                          </label>
                        );
                      })}
                  </div>
                </>
              )}
            </div>
          ) : null}
          <Button
            className="w-full bg-emerald-900 text-white hover:bg-emerald-950"
            disabled={
              pending ||
              (resume && sourceState !== "ready") ||
              (needsPermission && !canReadPrivate) ||
              (privateAnalysis &&
                (!options.privateRepos.length ||
                  repositories === null ||
                  repoError))
            }
            onClick={generate}
            type="button"
          >
            {pending ? dict.home.submitting : submitLabel}
          </Button>
          {error ? (
            <p role="alert" className="mt-3 text-sm leading-6 text-red-700">
              {error}
            </p>
          ) : null}
        </div>
        <aside
          className="generator-preview hidden lg:block"
          aria-label={t("선택한 템플릿", "Selected template")}
        >
          <div className="generator-preview-paper">
            <TemplatePreview locale={locale} template={options.template} />
          </div>
          <div className="generator-preview-caption">
            <p>
              {getTemplateMeta(locale)[options.template].label}
              <span>PDF · Word · HTML</span>
            </p>
            <p>
              {t(
                "미리보기에서 확인하고, 원하는 형식으로 저장하세요.",
                "Review your document, then save it in the format you need.",
              )}
            </p>
          </div>
        </aside>
      </div>
      {needsPermission ? (
        <p className="mt-4 text-xs leading-6 text-neutral-500">
          {t(
            "선택한 자료만 읽으며, 비공개 내용은 외부 AI로 보내지 않습니다. 결과 페이지는 나만 볼 수 있습니다.",
            "Only selected sources are read. Private content is not sent to external AI. Your results page is visible only to you.",
          )}
        </p>
      ) : null}

      {showGuide && resume ? (
        <div id="resume-setup-guide" className="mt-6 scroll-mt-5">
          <ResumeActivationPanel
            setupOnly
            availability={{ state: "locked_missing_repo" }}
            locale={locale}
            onClose={() => setShowGuide(false)}
          />
        </div>
      ) : null}
    </section>
  );
}
