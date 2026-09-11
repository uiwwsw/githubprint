import "server-only";
import {
  createProtectedValue,
  readProtectedValue,
  type GitHubAuthSession,
} from "@/lib/auth";
import {
  defaultDocumentOptions,
  documentOptionsSchema,
  DocumentConfigurationError,
  hasPrivateRepoPermission,
  needsPrivatePermission,
  type DocumentOptions,
} from "@/lib/document-options";
import type { TemplateId } from "@/lib/schemas";

const MAX_AGE_MS = 24 * 60 * 60 * 1000;

export function createDocumentConfiguration(
  options: DocumentOptions,
  session: GitHubAuthSession,
) {
  return createProtectedValue({
    purpose: "document-configuration",
    username: session.user.login.toLowerCase(),
    expiresAt: Date.now() + MAX_AGE_MS,
    options,
  });
}

export function resolveDocumentConfiguration(
  token: string | undefined,
  template: TemplateId,
  session: GitHubAuthSession,
): DocumentOptions {
  if (!token) return defaultDocumentOptions(template);
  if (token.length > 5000) throw new DocumentConfigurationError();
  const value = readProtectedValue<{
    purpose: string;
    username: string;
    expiresAt: number;
    options: unknown;
  }>(token);
  if (
    !value ||
    value.purpose !== "document-configuration" ||
    value.username !== session.user.login.toLowerCase() ||
    !Number.isFinite(value.expiresAt) ||
    value.expiresAt < Date.now()
  )
    throw new DocumentConfigurationError();
  const parsed = documentOptionsSchema.safeParse(value.options);
  if (
    !parsed.success ||
    parsed.data.template !== template ||
    (needsPrivatePermission(parsed.data) &&
      !hasPrivateRepoPermission(session.scopes))
  )
    throw new DocumentConfigurationError();
  return parsed.data;
}
