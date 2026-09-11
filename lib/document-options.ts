import { z } from "zod";
import type { TemplateId } from "@/lib/schemas";

export const MAX_PRIVATE_REPOS = 3;
export const documentOptionsSchema = z
  .object({
    template: z.enum(["brief", "profile", "insight", "resume"]),
    analysisScope: z.enum(["public", "private-summary", "private-details"]),
    privateRepos: z
      .array(
        z
          .string()
          .regex(/^[a-zA-Z0-9_.-]{1,100}$/)
          .refine((name) => name !== "." && name !== ".."),
      )
      .max(MAX_PRIVATE_REPOS),
    resumeSource: z.enum(["public", "authorized"]),
    resumeProjects: z.enum(["public", "authorized"]),
  })
  .strict()
  .superRefine((value, context) => {
    if (
      value.template !== "resume" &&
      value.analysisScope !== "public" &&
      !value.privateRepos.length
    ) {
      context.addIssue({
        code: "custom",
        path: ["privateRepos"],
        message: "Select at least one private repository.",
      });
    }
  })
  .transform((value) => ({
    ...value,
    analysisScope:
      value.template === "resume" ? ("public" as const) : value.analysisScope,
    privateRepos:
      value.template === "resume" || value.analysisScope === "public"
        ? []
        : [...new Set(value.privateRepos.map((name) => name.toLowerCase()))],
    resumeSource:
      value.template === "resume" ? value.resumeSource : ("public" as const),
    resumeProjects:
      value.template === "resume" ? value.resumeProjects : ("public" as const),
  }));

export type DocumentOptions = z.infer<typeof documentOptionsSchema>;

export function defaultDocumentOptions(template: TemplateId): DocumentOptions {
  return {
    template,
    analysisScope: "public",
    privateRepos: [],
    resumeSource: "public",
    resumeProjects: "public",
  };
}

export function hasPrivateRepoPermission(scopes: string[]) {
  return scopes.includes("repo");
}

export function needsPrivatePermission(options: DocumentOptions) {
  return options.template === "resume"
    ? options.resumeSource === "authorized" ||
        options.resumeProjects === "authorized"
    : options.analysisScope !== "public";
}

export class DocumentConfigurationError extends Error {
  constructor() {
    super(
      "Document configuration is missing, expired, or no longer authorized.",
    );
  }
}
