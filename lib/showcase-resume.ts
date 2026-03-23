import "server-only";

import { access, readFile } from "fs/promises";
import path from "path";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import {
  getResumeRepoBinaryAsset,
  getResumeRepoFileContents,
  getResumeRepoLookup,
} from "@/lib/github";
import {
  DEFAULT_RESUME_MANIFEST,
  buildResumeDocument,
  collectResumeMarkdownPaths,
  getResumeManifestCandidates,
  parseResumeYamlDocument,
  pickResumeManifestFile,
  type ResumeDocumentData,
} from "@/lib/resume";
import type { Locale } from "@/lib/schemas";

const SHOWCASE_CACHE_SECONDS = 60 * 60 * 24;
const LOCAL_SHOWCASE_RESUME_ROOT_CANDIDATES = [
  process.env.LOCAL_SHOWCASE_RESUME_ROOT?.trim(),
  path.resolve(process.cwd(), "../resume"),
].filter((value): value is string => Boolean(value));
const ASSET_FILE_PATTERN =
  /^assets\/[a-z0-9/_.-]+\.(png|jpg|jpeg|gif|webp|bmp)$/i;

type BinaryAsset = {
  contentType: string;
  data: Buffer;
};

async function pathExists(targetPath: string) {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

function resolveLocalResumeFilePath(rootPath: string, relativePath: string) {
  const resolvedRoot = path.resolve(rootPath);
  const resolvedPath = path.resolve(resolvedRoot, relativePath);

  if (
    resolvedPath !== resolvedRoot &&
    !resolvedPath.startsWith(`${resolvedRoot}${path.sep}`)
  ) {
    throw new Error(
      `Local showcase resume references must stay inside the configured repo: ${relativePath}`,
    );
  }

  return resolvedPath;
}

async function getLocalShowcaseResumeRoot() {
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  for (const rootPath of LOCAL_SHOWCASE_RESUME_ROOT_CANDIDATES) {
    if (await pathExists(path.join(rootPath, DEFAULT_RESUME_MANIFEST))) {
      return rootPath;
    }
  }

  return null;
}

async function pickLocalShowcaseManifestPath(rootPath: string, locale: Locale) {
  for (const candidate of getResumeManifestCandidates(locale)) {
    if (await pathExists(path.join(rootPath, candidate))) {
      return candidate;
    }
  }

  return null;
}

async function readLocalResumeTextFile(rootPath: string, relativePath: string) {
  try {
    return await readFile(
      resolveLocalResumeFilePath(rootPath, relativePath),
      "utf-8",
    );
  } catch {
    return null;
  }
}

async function readLocalResumeTextFiles(rootPath: string, relativePaths: string[]) {
  const uniquePaths = [...new Set(relativePaths.filter(Boolean))];
  const filePairs = await Promise.all(
    uniquePaths.map(async (relativePath) => [
      relativePath,
      await readLocalResumeTextFile(rootPath, relativePath),
    ] as const),
  );

  return Object.fromEntries(
    filePairs.filter(([, content]) => content !== null),
  ) as Record<string, string>;
}

function inferAssetContentType(filePath: string) {
  const lower = filePath.toLowerCase();

  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".bmp")) return "image/bmp";
  return "application/octet-stream";
}

function normalizePublicResumeDocument(
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
    source: {
      ...document.source,
      visibility: "public" as const,
    },
  };
}

async function buildLocalShowcaseResumeDocument(options: {
  locale: Locale;
  repoUrl: string;
  username: string;
}) {
  const rootPath = await getLocalShowcaseResumeRoot();

  if (!rootPath) {
    return null;
  }

  const manifestPath = await pickLocalShowcaseManifestPath(
    rootPath,
    options.locale,
  );

  if (!manifestPath) {
    return null;
  }

  const yamlSource = await readLocalResumeTextFile(rootPath, manifestPath);
  if (!yamlSource) {
    return null;
  }

  const parsed = parseResumeYamlDocument(yamlSource);
  if (!parsed.success) {
    return null;
  }

  const parseWarnings = [...parsed.warnings];
  const markdownPaths = collectResumeMarkdownPaths(parsed.data, parseWarnings);
  const referencedFiles = await readLocalResumeTextFiles(rootPath, markdownPaths);
  const document = buildResumeDocument(parsed.data, {
    contentFiles: referencedFiles,
    locale: options.locale,
    parseWarnings,
    repoCatalog: [],
    repoUrl: options.repoUrl,
    username: options.username,
    visibility: "public",
  });

  return normalizePublicResumeDocument(document, options.username);
}

async function buildRemoteShowcaseResumeDocument(options: {
  locale: Locale;
  repoUrl: string;
  username: string;
}) {
  try {
    const lookup = await getResumeRepoLookup(options.username);

    if (
      !lookup ||
      lookup.repo.visibility !== "public" ||
      !lookup.repo.rootFiles.includes(DEFAULT_RESUME_MANIFEST)
    ) {
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
      visibility: "public",
    });

    return normalizePublicResumeDocument(document, options.username);
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
  async (locale: Locale, repoUrl: string, username: string) => {
    const localDocument = await buildLocalShowcaseResumeDocument({
      locale,
      repoUrl,
      username,
    });

    if (localDocument) {
      return localDocument;
    }

    return getCachedRemoteShowcaseResumeDocument(locale, repoUrl, username);
  },
);

async function buildRemoteShowcaseResumeAsset(options: {
  filePath: string;
  username: string;
}): Promise<BinaryAsset | null> {
  const lookup = await getResumeRepoLookup(options.username);

  if (!lookup || lookup.repo.visibility !== "public") {
    return null;
  }

  try {
    return await getResumeRepoBinaryAsset(
      options.username,
      lookup.repo,
      options.filePath,
    );
  } catch {
    return null;
  }
}

const getCachedRemoteShowcaseResumeAsset = unstable_cache(
  async (username: string, filePath: string) =>
    buildRemoteShowcaseResumeAsset({
      filePath,
      username,
    }),
  ["showcase-public-resume-asset"],
  { revalidate: SHOWCASE_CACHE_SECONDS },
);

const getCachedPublicShowcaseResumeAsset = cache(
  async (username: string, filePath: string) => {
    const rootPath = await getLocalShowcaseResumeRoot();

    if (rootPath) {
      try {
        const data = await readFile(resolveLocalResumeFilePath(rootPath, filePath));

        return {
          contentType: inferAssetContentType(filePath),
          data,
        };
      } catch {
        return null;
      }
    }

    return getCachedRemoteShowcaseResumeAsset(username, filePath);
  },
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

  return getCachedPublicShowcaseResumeAsset(
    options.username,
    options.filePath,
  );
}
