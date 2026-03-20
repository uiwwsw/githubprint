import type { TemplateId } from "@/lib/schemas";

export const SELF_GENERATOR_TEMPLATE_KEY = "githubprint:self-generator:template";
export const SELF_GENERATOR_PRIVATE_KEY = "githubprint:self-generator:private";
export const DEFAULT_SELF_GENERATOR_TEMPLATE: TemplateId = "profile";

export function parseStoredTemplatePreference(
  value: string | null | undefined,
) {
  if (value === "brief" || value === "profile" || value === "insight") {
    return value satisfies TemplateId;
  }

  return null;
}

export function parseStoredPrivatePreference(
  value: string | null | undefined,
) {
  if (value === "1") {
    return true;
  }

  if (value === "0") {
    return false;
  }

  return null;
}
