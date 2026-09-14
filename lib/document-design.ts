import {
  AlignmentType,
  Document,
  Footer,
  HeadingLevel,
  PageNumber,
  Paragraph,
  TextRun,
  type ISectionOptions,
  type ParagraphChild,
} from "docx";
import type { Locale } from "@/lib/schemas";
import { WORD_FONTS } from "@/lib/document-fonts";

// A4, 17 mm margins. Shared by browser exports and the authenticated API.
export const DOCUMENT_PAGE = { width: 11906, height: 16838, margin: 964 };

export function documentHeading(text: string, level = 2) {
  return new Paragraph({
    keepNext: true,
    keepLines: true,
    heading:
      level === 1
        ? HeadingLevel.TITLE
        : level === 2
          ? HeadingLevel.HEADING_1
          : HeadingLevel.HEADING_2,
    children: [new TextRun(text)],
  });
}

export function documentParagraph(
  children: ParagraphChild[],
  bullet = false,
  keepNext = false,
  metadata = false,
) {
  return new Paragraph({
    children,
    widowControl: true,
    keepNext,
    ...(metadata ? { spacing: { after: 70 }, style: "DocumentMeta" } : {}),
    ...(bullet ? { bullet: { level: 0 }, spacing: { after: 75 } } : {}),
  });
}

export function createDesignedDocument({
  children,
  title,
  locale,
  templateLayout = false,
}: {
  children: ISectionOptions["children"];
  title: string;
  locale: Locale;
  templateLayout?: boolean;
}) {
  return new Document({
    creator: "GitHubPrint",
    title,
    description: "GitHubPrint developer document",
    styles: {
      paragraphStyles: [
        {
          id: "DocumentMeta",
          name: "Document metadata",
          basedOn: "Normal",
          run: { size: 18, color: "727B76" },
        },
      ],
      default: {
        document: {
          run: {
            font: WORD_FONTS,
            size: 21,
            color: "28332E",
            language: {
              value: locale === "ko" ? "ko-KR" : "en-US",
              eastAsia: "ko-KR",
            },
          },
          paragraph: { spacing: { after: 100, line: 280 } },
        },
        title: {
          run: {
            size: 56,
            bold: true,
            font: WORD_FONTS,
            color: "111916",
          },
          paragraph: {
            spacing: { before: 0, after: 180 },
            keepNext: true,
            keepLines: true,
          },
        },
        heading1: {
          run: {
            size: 27,
            bold: true,
            font: WORD_FONTS,
            color: "111916",
          },
          paragraph: {
            spacing: { before: 260, after: 120 },
            border: templateLayout
              ? undefined
              : {
                  bottom: {
                    color: "DCE5DF",
                    style: "single",
                    size: 4,
                    space: 6,
                  },
                },
            keepNext: true,
            keepLines: true,
          },
        },
        heading2: {
          run: {
            size: 23,
            bold: true,
            font: WORD_FONTS,
            color: "111916",
          },
          paragraph: {
            spacing: { before: 180, after: 80 },
            keepNext: true,
            keepLines: true,
          },
        },
        hyperlink: { run: { color: "176B50", underline: { type: "single" } } },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: DOCUMENT_PAGE.width, height: DOCUMENT_PAGE.height },
            margin: {
              top: DOCUMENT_PAGE.margin,
              bottom: DOCUMENT_PAGE.margin,
              left: DOCUMENT_PAGE.margin,
              right: DOCUMENT_PAGE.margin,
              header: 400,
              footer: 400,
            },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: "GitHubPrint   ·   ",
                    size: 16,
                    color: "727B76",
                  }),
                  new TextRun({
                    children: [
                      PageNumber.CURRENT,
                      " / ",
                      PageNumber.TOTAL_PAGES,
                    ],
                    size: 16,
                    color: "727B76",
                  }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });
}
