import "server-only";

import {
  AlignmentType,
  Document,
  ExternalHyperlink,
  HeadingLevel,
  ImageRun,
  Packer,
  Paragraph,
  TextRun,
  type ParagraphChild,
} from "docx";
import { getResumeCopy } from "@/lib/resume-copy";
import {
  buildResumeProjectEvidenceSummary,
  formatResumeProjectLabel,
  formatResumeDateRange,
  isResumeHighlightSectionId,
  parseResumeMarkdown,
  type ResumeCustomSection,
  type ResumeDocumentData,
  type ResumeEntry,
  type ResumeProject,
} from "@/lib/resume";
import type { Locale } from "@/lib/schemas";

function createText(text: string, options?: ConstructorParameters<typeof TextRun>[0]) {
  return new TextRun({
    ...(typeof options === "string" ? {} : options),
    text,
  });
}

function createLink(label: string, url: string) {
  return new ExternalHyperlink({
    children: [
      new TextRun({
        style: "Hyperlink",
        text: label,
      }),
    ],
    link: url,
  });
}

function createSectionHeading(title: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: {
      after: 140,
      before: 280,
    },
    thematicBreak: true,
    children: [createText(title, { bold: true })],
  });
}

async function createAvatarParagraph(avatarUrl?: string) {
  if (!avatarUrl) {
    return null;
  }

  try {
    const response = await fetch(avatarUrl, { cache: "no-store" });
    if (!response.ok) {
      return null;
    }

    const data = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get("content-type") ?? "";
    const imageType = contentType.includes("png")
      ? "png"
      : contentType.includes("jpeg") || contentType.includes("jpg")
        ? "jpg"
        : contentType.includes("gif")
          ? "gif"
          : contentType.includes("bmp")
            ? "bmp"
            : null;

    if (!imageType) {
      return null;
    }

    return new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: {
        after: 100,
      },
      children: [
        new ImageRun({
          data,
          type: imageType,
          transformation: {
            height: 96,
            width: 96,
          },
        }),
      ],
    });
  } catch {
    return null;
  }
}

function inferImageTypeFromContentType(contentType?: string) {
  if (!contentType) {
    return null;
  }

  if (contentType.includes("png")) return "png";
  if (contentType.includes("jpeg") || contentType.includes("jpg")) return "jpg";
  if (contentType.includes("gif")) return "gif";
  if (contentType.includes("bmp")) return "bmp";
  return null;
}

function createAvatarParagraphFromBuffer(
  data: Buffer,
  contentType?: string,
) {
  const imageType = inferImageTypeFromContentType(contentType);

  if (!imageType) {
    return null;
  }

  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: {
      after: 100,
    },
    children: [
      new ImageRun({
        data,
        type: imageType,
        transformation: {
          height: 96,
          width: 96,
        },
      }),
    ],
  });
}

function createMarkdownParagraphs(markdown: string) {
  return parseResumeMarkdown(markdown).flatMap((block) => {
    if (block.type === "heading") {
      return [
        new Paragraph({
          spacing: {
            after: block.level >= 3 ? 60 : 80,
            before: block.level >= 3 ? 100 : 120,
          },
          children: [
            createText(block.text, {
              bold: true,
              size: block.level >= 3 ? 22 : 24,
            }),
          ],
        }),
      ];
    }

    if (block.type === "list") {
      return block.items.map(
        (item) =>
          new Paragraph({
            bullet: { level: 0 },
            spacing: {
              after: 40,
            },
            children: [createText(item)],
          }),
      );
    }

    return [
      new Paragraph({
        spacing: {
          after: 120,
        },
        children: [createText(block.text)],
      }),
    ];
  });
}

function buildEntryParagraphs(
  entry: ResumeEntry,
  locale: Locale,
  linkLabel: string,
) {
  const paragraphs: Paragraph[] = [];
  const dateRange = formatResumeDateRange(
    entry.start,
    entry.end,
    entry.current,
    locale,
  );

  paragraphs.push(
    new Paragraph({
      spacing: {
        after: 40,
        before: 120,
      },
      children: [
        createText(entry.title, { bold: true }),
        ...(entry.subtitle ? [createText(`  ${entry.subtitle}`, { italics: true })] : []),
      ],
    }),
  );

  if (dateRange || entry.location) {
    paragraphs.push(
      new Paragraph({
        spacing: {
          after: 80,
        },
        children: [
          ...(dateRange ? [createText(dateRange)] : []),
          ...(dateRange && entry.location ? [createText("  |  ")] : []),
          ...(entry.location ? [createText(entry.location)] : []),
        ],
      }),
    );
  }

  if (entry.bullets.length > 0) {
    paragraphs.push(
      ...entry.bullets.map(
        (bullet) =>
          new Paragraph({
            bullet: { level: 0 },
            spacing: {
              after: 40,
            },
            children: [createText(bullet)],
          }),
      ),
    );
  }

  if (entry.detailsMarkdown) {
    paragraphs.push(...createMarkdownParagraphs(entry.detailsMarkdown));
  }

  if (entry.links.length > 0) {
    const children: ParagraphChild[] = [createText(`${linkLabel}: `, { bold: true })];
    entry.links.forEach((link, index) => {
      if (index > 0) {
        children.push(createText("  |  "));
      }
      children.push(createLink(link.label, link.url));
    });

    paragraphs.push(
      new Paragraph({
        spacing: {
          after: 120,
        },
        children,
      }),
    );
  }

  return paragraphs;
}

function buildProjectParagraphs(
  project: ResumeProject,
  locale: Locale,
  linkLabel: string,
  verifiedLabel: string,
  contextLabel: string,
  projectProfileLabel: string,
  githubStartLabel: string,
  independentLabel: string,
  whileAtLabel: string,
) {
  const paragraphs = buildEntryParagraphs(project, locale, linkLabel);
  const projectContext = project.linkedExperienceTitle
    ? `${whileAtLabel}: ${project.linkedExperienceTitle}`
    : independentLabel;
  const insertedParagraphs: Paragraph[] = [
    new Paragraph({
      spacing: {
        after: 80,
      },
      children: [
        createText(`${contextLabel}: `, { bold: true }),
        createText(projectContext),
      ],
    }),
  ];

  if (project.projectLabels.length > 0) {
    insertedParagraphs.push(
      new Paragraph({
        spacing: {
          after: 80,
        },
        children: [
          createText(`${projectProfileLabel}: `, { bold: true }),
          createText(
            project.projectLabels
              .map((label) => formatResumeProjectLabel(label, locale))
              .join(", "),
          ),
        ],
      }),
    );
  }

  if (project.tech.length > 0) {
    insertedParagraphs.push(
      new Paragraph({
        spacing: {
          after: 80,
        },
        children: [
          createText(locale === "ko" ? "기술: " : "Tech: ", { bold: true }),
          createText(project.tech.join(", ")),
        ],
      }),
    );
  }

  if (project.repoDescription && project.repoDescription !== project.subtitle) {
    insertedParagraphs.push(
      new Paragraph({
        spacing: {
          after: 80,
        },
        children: [createText(project.repoDescription)],
      }),
    );
  }

  const projectEvidenceSummary = buildResumeProjectEvidenceSummary(
    project,
    locale,
  );

  if (projectEvidenceSummary) {
    insertedParagraphs.push(
      new Paragraph({
        spacing: {
          after: 80,
        },
        children: [createText(projectEvidenceSummary)],
      }),
    );
  }

  if (project.repoVerified) {
    insertedParagraphs.push(
      new Paragraph({
        spacing: {
          after: 80,
        },
        children: [createText(verifiedLabel, { bold: true })],
      }),
    );
  }

  if (project.repoCreatedAt) {
    insertedParagraphs.push(
      new Paragraph({
        spacing: {
          after: 80,
        },
        children: [
          createText(`${githubStartLabel}: `, { bold: true }),
          createText(
            formatResumeDateRange(
              project.repoCreatedAt,
              undefined,
              false,
              locale,
            ) ?? project.repoCreatedAt,
          ),
        ],
      }),
    );
  }

  paragraphs.splice(2, 0, ...insertedParagraphs);

  return paragraphs;
}

function buildContactParagraph(document: ResumeDocumentData) {
  const contactParts: ParagraphChild[] = [];
  const pushSeparator = () => {
    if (contactParts.length > 0) {
      contactParts.push(createText("  |  "));
    }
  };

  if (document.basics.email) {
    pushSeparator();
    contactParts.push(createText(document.basics.email));
  }
  if (document.basics.phone) {
    pushSeparator();
    contactParts.push(createText(document.basics.phone));
  }
  if (document.basics.location) {
    pushSeparator();
    contactParts.push(createText(document.basics.location));
  }
  if (document.basics.website) {
    pushSeparator();
    contactParts.push(createLink(document.basics.website, document.basics.website));
  }
  document.basics.links.forEach((link) => {
    pushSeparator();
    contactParts.push(createLink(link.label, link.url));
  });

  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: {
      after: 180,
    },
    children: contactParts,
  });
}

function buildHighlightParagraphs(section: ResumeCustomSection) {
  return section.items.map((entry) => {
    const detail = entry.bullets[0] ?? "";

    return new Paragraph({
      bullet: { level: 0 },
      spacing: {
        after: 70,
      },
      children: [
        createText(entry.title, { bold: true }),
        ...(entry.subtitle ? [createText(`  |  ${entry.subtitle}`)] : []),
        ...(detail ? [createText(`  ${detail}`)] : []),
      ],
    });
  });
}

export async function buildResumeDocx(
  documentData: ResumeDocumentData,
  locale: Locale,
  options?: {
    avatarAsset?: {
      contentType?: string;
      data: Buffer;
    } | null;
    fallbackAvatarUrl?: string;
  },
) {
  const copy = getResumeCopy(locale);
  const avatarParagraph =
    (options?.avatarAsset
      ? createAvatarParagraphFromBuffer(
          options.avatarAsset.data,
          options.avatarAsset.contentType,
        )
      : null) ??
    (await createAvatarParagraph(
      documentData.basics.avatarUrl ?? options?.fallbackAvatarUrl,
    ));
  const highlightSections = documentData.customSections.filter((section) =>
    isResumeHighlightSectionId(section.id),
  );
  const trailingSections = documentData.customSections.filter(
    (section) => !isResumeHighlightSectionId(section.id),
  );
  const children: Paragraph[] = [
    ...(avatarParagraph ? [avatarParagraph] : []),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: {
        after: 100,
      },
      children: [
        createText(documentData.basics.name, {
          bold: true,
          size: 34,
        }),
      ],
    }),
  ];

  if (documentData.basics.headline) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: {
          after: 120,
        },
        children: [createText(documentData.basics.headline)],
      }),
    );
  }

  children.push(buildContactParagraph(documentData));

  highlightSections.forEach((section) => {
    if (section.items.length === 0) {
      return;
    }

    children.push(createSectionHeading(section.title));
    children.push(...buildHighlightParagraphs(section));
  });

  if (documentData.summary) {
    children.push(createSectionHeading(copy.template.sections.summary));
    children.push(...createMarkdownParagraphs(documentData.summary));
  }

  if (documentData.experience.length > 0) {
    children.push(createSectionHeading(copy.template.sections.experience));
    documentData.experience.forEach((entry) => {
      children.push(...buildEntryParagraphs(entry, locale, copy.template.sections.links));
    });
  }

  if (documentData.projects.length > 0) {
    children.push(createSectionHeading(copy.template.sections.projects));
    documentData.projects.forEach((project) => {
      children.push(
        ...buildProjectParagraphs(
          project,
          locale,
          copy.template.sections.links,
          copy.template.repoVerified,
          copy.template.projectContext,
          copy.template.projectProfile,
          copy.shared.githubStart,
          copy.shared.independent,
          copy.shared.whileAt,
        ),
      );
    });
  }

  if (documentData.education.length > 0) {
    children.push(createSectionHeading(copy.template.sections.education));
    documentData.education.forEach((entry) => {
      children.push(...buildEntryParagraphs(entry, locale, copy.template.sections.links));
    });
  }

  if (documentData.skills.length > 0) {
    children.push(createSectionHeading(copy.template.sections.skills));
    documentData.skills.forEach((group) => {
      children.push(
        new Paragraph({
          spacing: {
            after: 80,
          },
          children: [
            ...(group.title ? [createText(`${group.title}: `, { bold: true })] : []),
            createText(group.items.join(", ")),
          ],
        }),
      );
    });
  }

  trailingSections.forEach((section) => {
    if (section.items.length === 0) {
      return;
    }

    children.push(createSectionHeading(section.title));
    section.items.forEach((entry) => {
      children.push(...buildEntryParagraphs(entry, locale, copy.template.sections.links));
    });
  });

  children.push(
    new Paragraph({
      spacing: {
        before: 220,
      },
      children: [
        createText(`${copy.actions.repoSourceLabel}: `, { bold: true }),
        createLink(documentData.source.repoUrl, documentData.source.repoUrl),
      ],
    }),
  );

  const document = new Document({
    creator: "GitHubPrint",
    description: "GitHubPrint resume export",
    sections: [
      {
        children,
      },
    ],
    title: `${documentData.basics.name} Resume`,
  });

  return Packer.toBuffer(document);
}
