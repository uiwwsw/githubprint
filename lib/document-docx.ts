import {
  ExternalHyperlink,
  Packer,
  TextRun,
  Paragraph,
  ImageRun,
  HorizontalPositionAlign,
  HorizontalPositionRelativeFrom,
  VerticalPositionRelativeFrom,
  TextWrappingType,
} from "docx";
import {
  createDesignedDocument,
  documentHeading,
  documentParagraph,
} from "@/lib/document-design";
import { safeDocumentLink, type DocumentBlock } from "@/lib/document-snapshot";
import type { Locale } from "@/lib/schemas";

export async function buildDocumentDocx(
  blocks: DocumentBlock[],
  locale: Locale,
  title: string,
  fontData?: Uint8Array,
  headingFontData?: Uint8Array,
  avatar?: Uint8Array | null,
) {
  const children = blocks.map((block) => {
    if (["title", "heading", "subheading"].includes(block.kind)) {
      return documentHeading(
        block.runs
          .map((run) => run.text)
          .join("")
          .trim(),
        block.kind === "title" ? 1 : block.kind === "heading" ? 2 : 3,
      );
    }
    return documentParagraph(
      block.runs.map((run) => {
        const href = run.href && safeDocumentLink(run.href);
        const text = new TextRun({
          text: run.text,
          bold: run.bold,
          italics: run.italic,
          ...(href ? { style: "Hyperlink" } : {}),
        });
        return href
          ? new ExternalHyperlink({ link: href, children: [text] })
          : text;
      }),
      block.kind === "bullet",
      block.keepNext,
      block.kind === "metadata",
    );
  });
  if (avatar)
    children.unshift(
      new Paragraph({
        spacing: { before: 0, after: 0, line: 1 },
        keepNext: true,
        children: [
          new ImageRun({
            data: avatar,
            type: "png",
            transformation: { width: 64, height: 64 },
            floating: {
              horizontalPosition: {
                relative: HorizontalPositionRelativeFrom.MARGIN,
                align: HorizontalPositionAlign.RIGHT,
              },
              verticalPosition: {
                relative: VerticalPositionRelativeFrom.PARAGRAPH,
                offset: 0,
              },
              wrap: { type: TextWrappingType.SQUARE },
              margins: { left: 114300, bottom: 114300 },
              allowOverlap: false,
            },
          }),
        ],
      }),
    );
  return Packer.toBlob(
    createDesignedDocument({
      children,
      title,
      locale,
      fontData,
      headingFontData,
    }),
  );
}
