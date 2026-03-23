import "server-only";

import { access, readFile } from "fs/promises";
import path from "path";
import { readEnv } from "@/lib/env";
import {
  getResumeRepoFileContents,
  getResumeRepoLookup,
  type GitHubSourceAuthContext,
} from "@/lib/github";
import {
  DEFAULT_RESUME_MANIFEST,
  buildResumeDocument,
  collectResumeMarkdownPaths,
  parseResumeYamlDocument,
  getResumeManifestCandidates,
  pickResumeManifestFile,
  type ResumeTemplateAvailability,
} from "@/lib/resume";
import type { Locale } from "@/lib/schemas";

function isLocalDevelopment() {
  return process.env.NODE_ENV !== "production";
}

async function pathExists(targetPath: string) {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function getLocalResumeRepoRoot() {
  if (!isLocalDevelopment()) {
    return null;
  }

  const configuredRoot = readEnv(
    "GITFOLIO_LOCAL_RESUME_REPO_PATH",
    "GITHUBPRINT_LOCAL_RESUME_REPO_PATH",
  );
  const candidates = configuredRoot
    ? [path.resolve(configuredRoot)]
    : [path.resolve(process.cwd(), "../resume")];

  for (const candidate of candidates) {
    if (await pathExists(path.join(candidate, DEFAULT_RESUME_MANIFEST))) {
      return candidate;
    }
  }

  return null;
}

async function pickLocalResumeManifestPath(rootPath: string, locale: Locale) {
  for (const candidate of getResumeManifestCandidates(locale)) {
    if (await pathExists(path.join(rootPath, candidate))) {
      return candidate;
    }
  }

  return null;
}

function resolveLocalResumeFilePath(rootPath: string, relativePath: string) {
  const resolvedRoot = path.resolve(rootPath);
  const resolvedPath = path.resolve(resolvedRoot, relativePath);

  if (
    resolvedPath !== resolvedRoot &&
    !resolvedPath.startsWith(`${resolvedRoot}${path.sep}`)
  ) {
    throw new Error(
      `Local resume file references must stay inside the configured repo: ${relativePath}`,
    );
  }

  return resolvedPath;
}

async function readLocalResumeTextFile(
  rootPath: string,
  relativePath: string,
) {
  try {
    return await readFile(
      resolveLocalResumeFilePath(rootPath, relativePath),
      "utf-8",
    );
  } catch {
    return null;
  }
}

async function readLocalResumeTextFiles(
  rootPath: string,
  relativePaths: string[],
) {
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

function inferLocalAssetContentType(filePath: string) {
  const lower = filePath.toLowerCase();

  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".bmp")) return "image/bmp";
  return "application/octet-stream";
}

export async function getLocalResumeRepoBinaryAsset(filePath: string) {
  const rootPath = await getLocalResumeRepoRoot();

  if (!rootPath) {
    return null;
  }

  try {
    const data = await readFile(resolveLocalResumeFilePath(rootPath, filePath));
    return {
      contentType: inferLocalAssetContentType(filePath),
      data,
    };
  } catch {
    return null;
  }
}

export async function getResumeTemplateAvailability(options: {
  authContext: GitHubSourceAuthContext;
  forceFresh?: boolean;
  locale: Locale;
  username: string;
}): Promise<ResumeTemplateAvailability> {
  const localResumeRepoRoot = await getLocalResumeRepoRoot();
  const lookup = await getResumeRepoLookup(options.username, {
    authContext: options.authContext,
    forceFresh: options.forceFresh,
  });

  if (!lookup) {
    return {
      state: "locked_missing_repo",
    };
  }

  if (!lookup.repo.rootFiles.includes(DEFAULT_RESUME_MANIFEST)) {
    return {
      detail: `Missing required root file: ${DEFAULT_RESUME_MANIFEST}`,
      repoUrl: lookup.repo.repoUrl,
      repoVisibility: lookup.repo.visibility,
      state: "locked_invalid_schema",
    };
  }

  const manifestPath = localResumeRepoRoot
    ? await pickLocalResumeManifestPath(localResumeRepoRoot, options.locale)
    : pickResumeManifestFile(lookup.repo.rootFiles, options.locale);

  if (!manifestPath) {
    return {
      detail: `No readable resume manifest was found for locale: ${options.locale}`,
      repoUrl: lookup.repo.repoUrl,
      repoVisibility: lookup.repo.visibility,
      state: "locked_invalid_schema",
    };
  }

  const initialFiles = localResumeRepoRoot
    ? await readLocalResumeTextFiles(localResumeRepoRoot, [manifestPath])
    : await getResumeRepoFileContents(
        options.username,
        lookup.repo,
        [manifestPath],
        {
          authContext: options.authContext,
          forceFresh: options.forceFresh,
        },
      );
  const yamlSource = initialFiles[manifestPath];

  if (!yamlSource) {
    return {
      detail: `${manifestPath} could not be read from the repository.`,
      repoUrl: lookup.repo.repoUrl,
      repoVisibility: lookup.repo.visibility,
      state: "locked_invalid_schema",
    };
  }

  const parsed = parseResumeYamlDocument(yamlSource);

  if (!parsed.success) {
    return {
      detail: `${manifestPath}: ${parsed.error}`,
      repoUrl: lookup.repo.repoUrl,
      repoVisibility: lookup.repo.visibility,
      state: "locked_invalid_schema",
    };
  }

  try {
    const parseWarnings = [...parsed.warnings];
    const markdownPaths = collectResumeMarkdownPaths(parsed.data, parseWarnings);
    const referencedFiles =
      markdownPaths.length > 0
        ? localResumeRepoRoot
          ? await readLocalResumeTextFiles(localResumeRepoRoot, markdownPaths)
          : await getResumeRepoFileContents(
              options.username,
              lookup.repo,
              markdownPaths,
              {
                authContext: options.authContext,
                forceFresh: options.forceFresh,
              },
            )
        : {};

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
      repoUrl: lookup.repo.repoUrl,
      updatedAt: lookup.repo.updatedAt,
      username: options.username,
      visibility: lookup.repo.visibility,
    });

    return {
      document,
      repoUrl: lookup.repo.repoUrl,
      repoVisibility: lookup.repo.visibility,
      state: "ready",
    };
  } catch (error) {
    return {
      detail:
        error instanceof Error
          ? error.message
          : "Resume content could not be normalized.",
      repoUrl: lookup.repo.repoUrl,
      repoVisibility: lookup.repo.visibility,
      state: "locked_invalid_schema",
    };
  }
}
