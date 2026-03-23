import "server-only";

import { cache } from "react";
import { unstable_cache } from "next/cache";
import {
  getRepoEntryFromUrl,
  getResumeRepoBinaryAsset,
  getResumeRepoFileContents,
  getResumeRepoLookup,
} from "@/lib/github";
import {
  DEFAULT_RESUME_MANIFEST,
  buildResumeDocument,
  collectResumeMarkdownPaths,
  parseResumeYamlDocument,
  pickResumeManifestFile,
  type ResumeDocumentData,
} from "@/lib/resume";
import { getShowcaseRecordByUsername } from "@/lib/showcase";
import type { Locale } from "@/lib/schemas";

const SHOWCASE_CACHE_SECONDS = 60 * 60 * 24;
const ASSET_FILE_PATTERN =
  /^assets\/[a-z0-9/_.-]+\.(png|jpg|jpeg|gif|webp|bmp)$/i;

type BinaryAsset = {
  contentType: string;
  data: Buffer;
};

function normalizeShowcaseResumeDocument(
  document: ResumeDocumentData,
  username: string,
) {
  const basics = { ...document.basics };

  if (document.basics.avatarPath) {
    basics.avatarUrl = `/api/public-resume-asset?username=${encodeURIComponent(username)}&path=${encodeURIComponent(document.basics.avatarPath)}`;
    delete basics.avatarPath;
  }

  return {
    ...document,
    basics,
  };
}

async function getShowcaseResumeRepoLookup(options: {
  repoUrl: string;
  username: string;
}) {
  const [directRepoResult, publicLookupResult] = await Promise.allSettled([
    getRepoEntryFromUrl(options.repoUrl),
    getResumeRepoLookup(options.username),
  ]);
  const directRepo =
    directRepoResult.status === "fulfilled" ? directRepoResult.value : null;
  const publicLookup =
    publicLookupResult.status === "fulfilled" ? publicLookupResult.value : null;

  if (!directRepo) {
    return publicLookup;
  }

  return {
    repo: directRepo,
    repoCatalog: publicLookup?.repoCatalog ?? [],
  };
}

async function buildRemoteShowcaseResumeDocument(options: {
  locale: Locale;
  repoUrl: string;
  username: string;
}) {
  try {
    const lookup = await getShowcaseResumeRepoLookup(options);

    if (!lookup || !lookup.repo.rootFiles.includes(DEFAULT_RESUME_MANIFEST)) {
      return null;
    }

    const manifestPath = pickResumeManifestFile(
      lookup.repo.rootFiles,
      options.locale,
    );

    if (!manifestPath) {
      return null;
    }

    const yamlSource = (
      await getResumeRepoFileContents(
        options.username,
        lookup.repo,
        [manifestPath],
      )
    )[manifestPath];

    if (!yamlSource) {
      return null;
    }

    const parsed = parseResumeYamlDocument(yamlSource);
    if (!parsed.success) {
      return null;
    }

    const parseWarnings = [...parsed.warnings];
    const markdownPaths = collectResumeMarkdownPaths(parsed.data, parseWarnings);
    const referencedFiles = await getResumeRepoFileContents(
      options.username,
      lookup.repo,
      markdownPaths,
    );
    const document = buildResumeDocument(parsed.data, {
      contentFiles: referencedFiles,
      locale: options.locale,
      parseWarnings,
      repoCatalog: lookup.repoCatalog.map((repo) => ({
        createdAt: repo.createdAt,
        description: repo.description,
        homepageUrl: repo.homepageUrl,
        language: repo.language,
        name: repo.name,
        projectLabels: repo.projectLabels,
        pushedAt: repo.pushedAt,
        repoUrl: repo.repoUrl,
        topics: repo.topics,
        updatedAt: repo.updatedAt,
      })),
      repoUrl: lookup.repo.repoUrl || options.repoUrl,
      updatedAt: lookup.repo.updatedAt,
      username: options.username,
      visibility: lookup.repo.visibility,
    });

    return normalizeShowcaseResumeDocument(document, options.username);
  } catch {
    return null;
  }
}

const getCachedRemoteShowcaseResumeDocument = unstable_cache(
  async (locale: Locale, repoUrl: string, username: string) =>
    buildRemoteShowcaseResumeDocument({
      locale,
      repoUrl,
      username,
    }),
  ["showcase-public-resume-document"],
  { revalidate: SHOWCASE_CACHE_SECONDS },
);

const getCachedPublicShowcaseResumeDocument = cache(
  async (locale: Locale, repoUrl: string, username: string) =>
    getCachedRemoteShowcaseResumeDocument(locale, repoUrl, username),
);

async function buildRemoteShowcaseResumeAsset(options: {
  filePath: string;
  repoUrl: string;
  username: string;
}): Promise<BinaryAsset | null> {
  const repo = await getRepoEntryFromUrl(options.repoUrl);

  if (!repo) {
    return null;
  }

  try {
    return await getResumeRepoBinaryAsset(
      options.username,
      repo,
      options.filePath,
    );
  } catch {
    return null;
  }
}

const getCachedRemoteShowcaseResumeAsset = unstable_cache(
  async (repoUrl: string, username: string, filePath: string) =>
    buildRemoteShowcaseResumeAsset({
      filePath,
      repoUrl,
      username,
    }),
  ["showcase-public-resume-asset"],
  { revalidate: SHOWCASE_CACHE_SECONDS },
);

const getCachedPublicShowcaseResumeAsset = cache(
  async (repoUrl: string, username: string, filePath: string) =>
    getCachedRemoteShowcaseResumeAsset(repoUrl, username, filePath),
);

export async function getPublicShowcaseResumeDocument(options: {
  locale: Locale;
  repoUrl: string;
  username: string;
}) {
  return getCachedPublicShowcaseResumeDocument(
    options.locale,
    options.repoUrl,
    options.username,
  );
}

export async function getPublicShowcaseResumeAsset(options: {
  filePath: string;
  username: string;
}): Promise<BinaryAsset | null> {
  if (!ASSET_FILE_PATTERN.test(options.filePath) || options.filePath.includes("..")) {
    return null;
  }

  const showcase = getShowcaseRecordByUsername(options.username);

  if (!showcase) {
    return null;
  }

  return getCachedPublicShowcaseResumeAsset(
    showcase.resumeRepoUrl,
    options.username,
    options.filePath,
  );
}
