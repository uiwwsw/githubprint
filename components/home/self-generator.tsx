"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

type RepoChoice = { name: string; archived: boolean };

export function SelfGenerator({
  canReadPrivate,
  initialTemplate,
  initialOptions,
  resumeOnly = false,
  locale,
  privateLoginHref,
  username,
}: {
  canReadPrivate: boolean;
  initialTemplate: TemplateId;
  initialOptions?: DocumentOptions;
  resumeOnly?: boolean;
  locale: Locale;
  privateLoginHref: string;
  username: string;
}) {
  const router = useRouter();
  const dict = getDictionary(locale);
  const ko = locale === "ko";
  const t = (kr: string, en: string) => (ko ? kr : en);
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
      if (!response.ok)
        throw new Error(
          response.status === 403 ? "permission" : "configuration",
        );
      const data = await response.json();
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
      "Brief는 소개에 필요한 핵심만 담습니다. 비공개 작업은 익명 요약으로 부족한 공개 근거를 보완할 수 있습니다.",
      "Brief keeps an introduction focused. Anonymous private-work signals can supplement limited public evidence.",
    ),
    profile: t(
      "Profile은 프로젝트가 중심입니다. 소개할 수 있는 비공개 작업만 골라 상세 사례로 추가하세요.",
      "Profile centers on projects. Add only private work you can describe as a detailed case study.",
    ),
    insight: t(
      "Insight는 작업 패턴을 살펴봅니다. 비공개 신호를 보완해도 벤치마크와 비교 지표는 공개 근거만 사용합니다.",
      "Insight examines work patterns. Benchmarks and comparison metrics always use public evidence, even when private signals are added.",
    ),
    resume: t(
      "Resume는 직접 작성한 경력과 프로젝트를 편집합니다. 원본의 보관 장소와 프로젝트 정보 보강 범위를 따로 선택하세요.",
      "Resume formats the career and projects you authored. Choose source storage access separately from linked-project enrichment.",
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
          : t(
              "목적에 맞는 문서와 자료 선택",
              "Choose your document and its sources",
            )}
      </h2>
      {!resumeOnly && <div
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
      </div>}
      <p className="my-6 text-sm leading-7 text-neutral-600">
        {purpose[options.template]}
      </p>
      <div className="grid items-start gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-5">
          {resume ? (
            <>
              <fieldset className="rounded-2xl border border-black/10 p-5">
                <legend className="px-2 text-sm font-semibold">
                  {t("1. 이력서 원본 접근", "1. Resume source access")}
                </legend>
                <p className="mb-4 text-sm leading-6 text-neutral-500">
                  {t(
                    `@${username}/resume의 resume.yaml과 연결한 Markdown·이미지만 읽습니다.`,
                    `Read resume.yaml and its referenced Markdown and images in @${username}/resume.`,
                  )}
                </p>
                {(["public", "authorized"] as const).map((value) => (
                  <label
                    key={value}
                    className="mb-3 flex cursor-pointer items-start gap-3 text-sm"
                  >
                    <input
                      className="mt-1 accent-emerald-800"
                      type="radio"
                      name="resume-source"
                      checked={options.resumeSource === value}
                      onChange={() =>
                        setOptions({ ...options, resumeSource: value })
                      }
                    />
                    <span>
                      {value === "public"
                        ? t(
                            "공개 resume 저장소만 읽기",
                            "Read a public resume repository only",
                          )
                        : t(
                            "내 비공개 resume 저장소도 읽기",
                            "Also allow my private resume repository",
                          )}
                    </span>
                  </label>
                ))}
                <p className="mt-3 text-xs leading-6 text-neutral-500">
                  {t(
                    "원본이 비공개여도 작성한 연락처·경력·링크는 문서에 그대로 들어갑니다. 이 선택은 익명화 기능이 아닙니다.",
                    "Even if the source is private, authored contact details, career history, and links appear in the document. This option does not anonymize them.",
                  )}
                </p>
              </fieldset>
              <fieldset className="rounded-2xl border border-black/10 p-5">
                <legend className="px-2 text-sm font-semibold">
                  {t(
                    "2. 연결 프로젝트 정보 보강",
                    "2. Linked-project enrichment",
                  )}
                </legend>
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
                      "원본의 repo 필드에 직접 연결한 내 비공개 프로젝트 정보도 사용",
                      "Use metadata from my private projects explicitly linked in the source’s repo fields",
                    )}
                  </span>
                </label>
                <p className="mt-3 text-xs leading-6 text-neutral-500">
                  {t(
                    "끄면 공개 프로젝트 정보만 보강합니다. 켜면 연결한 비공개 프로젝트의 설명·기술 정보·링크를 보강하고 ‘비공개’로 표시합니다. 직접 작성한 문장은 어느 경우에도 유지합니다.",
                    "When off, enrich from public projects only. When on, add descriptions, technology metadata, and links from referenced private projects, labeled Private. Your authored text is preserved in both cases.",
                  )}
                </p>
              </fieldset>
              <button
                type="button"
                className="text-sm underline underline-offset-4"
                onClick={() => setShowGuide(!showGuide)}
              >
                {t("resume.yaml 준비 방법", "How to prepare resume.yaml")}
              </button>
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
                  "GitHub OAuth의 repo 권한은 비공개 저장소 읽기·쓰기를 함께 허용합니다. GitHubPrint는 읽기 요청만 수행하며, 문서 생성에는 위에서 선택한 범위만 사용합니다.",
                  "GitHub OAuth’s repo scope grants both read and write access to private repositories. GitHubPrint makes read requests only and uses the scope selected above for document generation.",
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
          {needsPermission && canReadPrivate ? (
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
              className="text-xs text-neutral-500 underline underline-offset-4"
            >
              {t(
                "접근 오류가 있다면 GitHub 권한 다시 연결",
                "Reconnect GitHub access if a repository is unavailable",
              )}
            </a>
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
        </div>
        <aside
          className="rounded-2xl bg-neutral-950 p-6 text-white"
          aria-label={t("생성 전 확인", "Before you generate")}
        >
          <p className="text-[11px] tracking-[0.2em] text-emerald-300">
            DOCUMENT CONTENTS
          </p>
          <h3 className="mt-3 font-serif text-2xl">
            {t("파일에 들어갈 내용", "What goes into your files")}
          </h3>
          <p className="mt-4 text-sm leading-7 text-white/80">
            {resume
              ? t(
                  "원본에 직접 작성한 경력·연락처·프로젝트와 허용한 연결 저장소 정보입니다. 저장소가 비공개라는 이유로 내용을 자동으로 숨기지 않습니다.",
                  "Your authored career history, contact details, and projects, plus allowed linked-repository metadata. Private storage does not automatically hide its content.",
                )
              : choices.find((choice) => choice.value === options.analysisScope)
                  ?.text}
          </p>
          <div className="my-5 border-t border-white/15" />
          <p className="text-xs leading-6 text-white/60">
            {t(
              "PDF · Word · HTML 모두 미리보기와 같은 자료 범위를 사용합니다. 결과에서 내용을 확인한 뒤 저장하세요.",
              "PDF, Word, and HTML all use the same source selection as the preview. Review the result before saving.",
            )}
          </p>
          {needsPermission ? (
            <p className="mt-4 text-xs leading-6 text-emerald-200">
              {t(
                "선택한 비공개 데이터는 외부 AI로 보내거나 학습용 기록으로 저장하지 않습니다. 결과는 로그인한 본인에게만 표시됩니다.",
                "Selected private data is not sent to external AI or saved as learning records. Results are shown only to you while signed in.",
              )}
            </p>
          ) : null}
          {!resume ? (
            <p className="mt-4 text-xs leading-6 text-white/60">
              {t(
                "벤치마크는 공개 자료 기준입니다. 비공개 작업 요약이 경력·성과를 증명하지는 않습니다.",
                "Benchmarks use public sources. Private-work summaries do not establish career history or outcomes.",
              )}
            </p>
          ) : null}
          <Button
            className="mt-6 w-full bg-emerald-300 text-emerald-950 hover:bg-emerald-200"
            disabled={
              pending ||
              (needsPermission && !canReadPrivate) ||
              (privateAnalysis &&
                (!options.privateRepos.length ||
                  repositories === null ||
                  repoError))
            }
            onClick={generate}
            type="button"
          >
            {pending
              ? dict.home.submitting
              : resumeOnly
                ? t("이력서 다시 불러오기", "Load resume again")
                : dict.home.submit}
          </Button>
          {error ? (
            <p role="alert" className="mt-3 text-sm leading-6 text-amber-200">
              {error}
            </p>
          ) : null}
        </aside>
      </div>
      {showGuide && resume ? (
        <div className="mt-6">
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
