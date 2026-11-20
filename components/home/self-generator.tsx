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
import {
  DEFAULT_SELF_GENERATOR_TEMPLATE,
  SELF_GENERATOR_TEMPLATE_KEY,
} from "@/lib/self-generator-preferences";
import { getTemplateMeta } from "@/lib/templates";
import type { Locale, TemplateId } from "@/lib/schemas";
import type { ResumeReadiness } from "@/lib/resume-readiness";

const repositoryStyles = ["brief", "profile", "insight"] as const;

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
  const templateMeta = getTemplateMeta(locale);
  const ko = locale === "ko";
  const t = (kr: string, en: string) => (ko ? kr : en);
  const submitLabel = resumeOnly
    ? t("이력서 다시 불러오기", "Load resume again")
    : dict.home.submit;
  const [repositoryStyle, setRepositoryStyle] = useState(
    initialTemplate === "resume"
      ? DEFAULT_SELF_GENERATOR_TEMPLATE
      : initialTemplate,
  );
  const [options, setOptions] = useState<DocumentOptions>(() =>
    initialOptions ?? defaultDocumentOptions(resumeOnly ? "resume" : repositoryStyle),
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
  // Visibility is not a user decision: read with whatever access the session already has.
  const autoResumeSource = canReadPrivate ? "authorized" : "public";
  useEffect(() => {
    setOptions((current) =>
      current.resumeSource === autoResumeSource
        ? current
        : { ...current, resumeSource: autoResumeSource },
    );
  }, [autoResumeSource]);
  const includePrivate = !resume && options.analysisScope === "private-details";
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
          const savedTemplate = value.options.template as TemplateId;
          const savedPrivate = value.options.analysisScope === "private-details";
          setOptions({
            ...defaultDocumentOptions(savedTemplate),
            ...value.options,
            analysisScope: savedPrivate ? "private-details" : "public",
            privateRepos: savedPrivate ? value.options.privateRepos : [],
          });
          if (savedTemplate !== "resume") setRepositoryStyle(savedTemplate);
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
    if (!includePrivate || !canReadPrivate) return;
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
  }, [includePrivate, canReadPrivate, retry]);

  function selectMode(nextResume: boolean) {
    if (nextResume === resume) return;
    setShowGuide(false);
    setError("");
    setOptions({
      ...defaultDocumentOptions(nextResume ? "resume" : repositoryStyle),
      resumeSource: autoResumeSource,
    });
  }

  function selectStyle(template: (typeof repositoryStyles)[number]) {
    setRepositoryStyle(template);
    setOptions((current) => ({ ...current, template }));
    setError("");
    try {
      document.cookie = `${SELF_GENERATOR_TEMPLATE_KEY}=${template}; Max-Age=31536000; Path=/; SameSite=Lax`;
    } catch {
      /* The current session still uses the selected design. */
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
      title: t("공개 저장소만", "Public repositories only"),
      text: t("공개 저장소를 최대 5개 담습니다.", "Include up to five public repositories."),
    },
    {
      value: "private-details" as const,
      title: t("비공개 저장소도 포함", "Include private repositories"),
      text: t(
        "고른 비공개 저장소의 이름, 설명, 링크도 파일에 들어갑니다.",
        "Files also include the names, descriptions, and links of the private repositories you choose.",
      ),
    },
  ];

  return (
    <section
      id="generator"
      className="gp-generator"
      aria-labelledby="generator-title"
    >
      <p className="gp-generator-account">@{username}</p>
      <h2 id="generator-title" className="mt-1">
        {resumeOnly
          ? t("기존 이력서 연결", "Connect your existing resume")
          : t("어떤 문서를 만들까요?", "What would you like to make?")}
      </h2>
      {!resumeOnly ? (
        <div
          className="gp-template-picker gp-mode-picker"
          role="group"
          aria-label={t("문서 종류", "Document type")}
        >
          <button type="button" aria-pressed={!resume} onClick={() => selectMode(false)}>
            <strong>{t("저장소 목록", "Repository list")}</strong>
            <span>{t("이름, 설명, GitHub 링크", "Names, descriptions, and GitHub links")}</span>
          </button>
          <button type="button" aria-pressed={resume} onClick={() => selectMode(true)}>
            <strong>{t("이력서 전용", "Resume only")}</strong>
            <span>{t("직접 작성한 resume.yaml 필요", "Requires your own resume.yaml")}</span>
          </button>
        </div>
      ) : null}
      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-5">
          {resume ? (
            <>
              <fieldset className="resume-source-picker">
                <legend>
                  {t("이력서가 있는 저장소", "Your resume repository")}
                </legend>
                <p className="source-location">github.com/{username}/resume</p>
                {sourceState !== "ready" ? (
                  <p className="source-caption">
                    {t(
                      "이력서를 만들려면 GitHub에 resume 저장소를 만들고 루트에 resume.yaml을 작성해 주세요.",
                      "To make a resume, create a GitHub repository named resume and add your own resume.yaml at its root.",
                    )}
                  </p>
                ) : null}
              </fieldset>
            </>
          ) : (
            <fieldset className="space-y-3">
              <legend className="mb-3 text-[15px] font-bold">
                {t("저장소 공개 범위", "Repository visibility")}
              </legend>
              {choices.map((choice) => (
                <label
                  key={choice.value}
                  className="gp-choice"
                  data-selected={options.analysisScope === choice.value}
                >
                  <input
                    type="radio"
                    name="analysis-scope"
                    className="mt-1"
                    checked={options.analysisScope === choice.value}
                    onChange={() =>
                      setOptions((current) => ({
                        ...current,
                        analysisScope: choice.value,
                        privateRepos: choice.value === "public" ? [] : current.privateRepos,
                      }))
                    }
                  />
                  <span>
                    <span className="block text-[15px] font-bold">
                      {choice.title}
                    </span>
                    <span className="mt-1 block text-[13px] leading-6 text-ink-soft">
                      {choice.text}
                    </span>
                  </span>
                </label>
              ))}
            </fieldset>
          )}
          {needsPermission && !canReadPrivate ? (
            <div className="gp-status" data-tone="problem">
              <h3 className="font-bold">
                {t(
                  "비공개 접근 권한 연결",
                  "Connect private repository access",
                )}
              </h3>
              <p className="mt-2 text-[13px] leading-6">
                {t(
                  "GitHub는 비공개 저장소의 읽기·쓰기 권한을 함께 요청합니다. GitHubPrint는 선택한 자료를 읽기만 합니다.",
                  "GitHub requests both read and write permission for private repositories. GitHubPrint only reads the sources you select.",
                )}
              </p>
              <a
                href={privateLoginHref}
                onClick={rememberSelection}
                className="gp-button gp-button-small mt-4"
              >
                {t("GitHub에서 권한 연결", "Connect access on GitHub")}
              </a>
            </div>
          ) : null}
          {resume &&
          !(options.resumeSource === "authorized" && !canReadPrivate) ? (
            <div
              className="gp-status"
              data-tone={
                sourceState === "ready"
                  ? "ready"
                  : sourceState
                    ? "problem"
                    : undefined
              }
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
                    ? t(
                        "읽을 수 있는 resume 저장소를 찾지 못했습니다.",
                        "We couldn’t find a resume repository we can open.",
                      )
                    : sourceState === "invalid_schema"
                      ? t(
                          "resume.yaml이 저장소 루트에 있는지와 파일 내용을 확인해 주세요.",
                          "Check that resume.yaml is at the repository root and that its contents are valid.",
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
                                "GitHub 요청 한도에 도달했습니다. 잠시 후 다시 확인해 주세요.",
                                "GitHub’s request limit was reached. Try again in a moment.",
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
                {sourceState === "missing_repo" && !canReadPrivate ? (
                  <a
                    href={privateLoginHref}
                    onClick={rememberSelection}
                    className="underline underline-offset-4"
                  >
                    {t("비공개 저장소 접근 연결", "Connect private access")}
                  </a>
                ) : null}
                {sourceState === "missing_repo" ? (
                  <button
                    type="button"
                    className="underline underline-offset-4"
                    onClick={() => {
                      if (!resumeOnly) return selectMode(false);
                      window.location.assign(`${ko ? "" : "/en"}/#generator`);
                    }}
                  >
                    {t(
                      "저장소 목록 만들기",
                      "Make a repository list",
                    )}
                  </button>
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
          {includePrivate && canReadPrivate ? (
            <div className="gp-status">
              <h3 className="font-bold">
                {t(
                  "문서에 넣을 비공개 저장소",
                  "Private repositories to include",
                )}{" "}
                <span className="font-medium text-ink-soft">
                  {options.privateRepos.length}/{MAX_PRIVATE_REPOS}
                </span>
              </h3>
              <p className="mt-2 text-[13px] leading-6 text-ink-soft">
                {t(
                  "내 비공개 저장소에서 최대 3개까지 고를 수 있습니다.",
                  "Choose up to three of your private repositories.",
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
                    className="mt-3 w-full rounded-md border border-rule bg-paper px-3 py-2 text-sm"
                  />
                  {options.privateRepos.length ? (
                    <p className="mt-3 break-all text-[13px] font-semibold leading-6">
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
                            className="flex cursor-pointer items-start gap-3 rounded-md p-2 text-sm hover:bg-paper"
                          >
                            <input
                              className="mt-1"
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
                                <span className="ml-2 text-xs text-ink-soft">
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
          {!resume ? (
            <fieldset>
              <legend className="text-[15px] font-bold">{t("문서 디자인", "Document design")}</legend>
              <div className="gp-template-picker gp-style-picker">
                {repositoryStyles.map((id) => {
                  const meta = templateMeta[id];
                  return (
                    <button
                      type="button"
                      key={id}
                      aria-pressed={options.template === id}
                      onClick={() => selectStyle(id)}
                    >
                      <strong>{meta.label}</strong>
                      <span>{meta.shortLabel}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ) : null}
          <Button
            size="lg"
            className="w-full"
            disabled={
              pending ||
              (resume && sourceState !== "ready") ||
              (needsPermission && !canReadPrivate) ||
              (includePrivate &&
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
            <p role="alert" className="mt-3 text-sm leading-6 text-proof">
              {error}
            </p>
          ) : null}
        </div>
        <aside
          className="gp-generator-preview hidden lg:block"
          aria-label={t("선택한 템플릿", "Selected template")}
        >
          <TemplatePreview locale={locale} template={options.template} />
          <div>
            <p>
              <strong>{templateMeta[options.template].label}</strong>
              {t(
                " 디자인 예시",
                " design example",
              )}
            </p>
          </div>
        </aside>
      </div>
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
