import { SectionBlock } from "@/components/result/common";
import { DocumentMasthead, DocumentShell } from "@/components/result/document-shell";
import { ResumeTemplate } from "@/components/templates/resume";
import type { RepositoryDocumentEntry } from "@/lib/github";
import { getDictionary } from "@/lib/i18n";
import type { ResumeDocumentData } from "@/lib/resume";
import type { Locale, TemplateId } from "@/lib/schemas";
import { formatNumber } from "@/lib/utils";

type SharedTemplateProps = {
  avatarUrl?: string;
  generatedAt: string;
  locale: Locale;
  profileUrl: string;
};

type RepositoryRenderProps = SharedTemplateProps & {
  name: string;
  repositories: RepositoryDocumentEntry[];
  template: Exclude<TemplateId, "resume">;
};

type ResumeRenderProps = SharedTemplateProps & {
  resumeDocument: ResumeDocumentData;
  template: "resume";
};

export function RenderTemplate(props: RepositoryRenderProps | ResumeRenderProps) {
  return (
    <section id="result-preview">
      {props.template === "resume" ? (
        <ResumeTemplate
          avatarUrl={props.avatarUrl}
          generatedAt={props.generatedAt}
          locale={props.locale}
          profileUrl={props.profileUrl}
          resume={props.resumeDocument}
        />
      ) : (
        <RepositoryDocument {...props} />
      )}
    </section>
  );
}

function RepositoryDocument({
  avatarUrl,
  generatedAt,
  locale,
  name,
  profileUrl,
  repositories,
  template,
}: RepositoryRenderProps) {
  const ko = locale === "ko";
  const dict = getDictionary(locale);

  return (
    <DocumentShell
      template={template}
      accent={
        <DocumentMasthead
          template={dict.templateMeta[template].label}
          generatedAt={generatedAt}
          locale={locale}
        />
      }
    >
      <header className="document-identity">
        <div className="document-identity-top">
          {avatarUrl ? (
            <img className="document-avatar float-right" alt="" src={avatarUrl} />
          ) : null}
          <h1 className="break-words">{name}</h1>
          <a className="identity-link" href={profileUrl} rel="noreferrer" target="_blank">
            {profileUrl.replace(/^https?:\/\//, "")}
          </a>
        </div>
      </header>
      <SectionBlock title={ko ? "저장소 목록" : "Repositories"}>
        {repositories.length ? (
          <div className="repository-entries">
            {repositories.map((repo) => (
              <article className="document-project" key={repo.repoUrl}>
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <h3 className="min-w-0 break-all font-semibold">
                    <a href={repo.repoUrl} rel="noreferrer" target="_blank">
                      {repo.name}
                    </a>
                  </h3>
                  {repo.visibility === "private" ? (
                    <p className="text-xs text-neutral-600">{ko ? "비공개" : "Private"}</p>
                  ) : null}
                </div>
                {repo.description?.trim() ? (
                  <p className="mt-1 break-words">{repo.description.trim()}</p>
                ) : null}
                <p className="mt-2 text-xs font-medium text-neutral-600">
                  {[
                    repo.language && `${ko ? "주 언어" : "Primary language"} ${repo.language}`,
                    `${ko ? "스타" : "Stars"} ${formatNumber(repo.stars, locale)}`,
                    `${ko ? "포크" : "Forks"} ${formatNumber(repo.forks, locale)}`,
                  ].filter(Boolean).join(" · ")}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <p>{ko ? "표시할 저장소가 없습니다." : "There are no repositories to show."}</p>
        )}
      </SectionBlock>
    </DocumentShell>
  );
}
