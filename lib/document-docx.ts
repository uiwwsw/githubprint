import {
  AlignmentType,
  BorderStyle,
  ExternalHyperlink,
  HeadingLevel,
  ImageRun,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
  type ParagraphChild,
} from "docx";
import { createDesignedDocument, DOCUMENT_PAGE } from "@/lib/document-design";
import type {
  DocumentLayout,
  LayoutStyle,
  LayoutRun,
} from "@/lib/document-layout";
import { safeDocumentLink } from "@/lib/document-snapshot";
import type { Locale } from "@/lib/schemas";

const twips = (pixels: number) => Math.max(0, Math.round(pixels * 15));
const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = {
  top: noBorder,
  right: noBorder,
  bottom: noBorder,
  left: noBorder,
  insideHorizontal: noBorder,
  insideVertical: noBorder,
};
const sides = ["top", "right", "bottom", "left"] as const;
function borders(style: LayoutStyle) {
  return Object.fromEntries(
    sides.map((side, index) => [
      side,
      style.borders[index]
        ? {
            style: BorderStyle.SINGLE,
            size: Math.max(2, Math.round(style.borders[index]!.width * 6)),
            color: style.borders[index]!.color,
            space: Math.round(style.padding[index] * 0.75),
          }
        : noBorder,
    ]),
  );
}
function bytes(data: string) {
  return Uint8Array.from(atob(data.split(",")[1]), (character) =>
    character.charCodeAt(0),
  );
}

/** Native, editable Word layout: template cards and rows become shaded/bordered cells, never screenshots. */
export async function buildDocumentDocx(
  layout: DocumentLayout,
  locale: Locale,
  title: string,
  fontData?: Uint8Array,
  headingFontData?: Uint8Array,
) {
  type Child = Paragraph | Table;
  function retainShortGroups(node: DocumentLayout) {
    if (!("children" in node)) return;
    for (const child of node.children) retainShortGroups(child);
    const lastParagraph = (
      child: DocumentLayout,
    ): Extract<DocumentLayout, { kind: "paragraph" }> | undefined => {
      if (child.kind === "paragraph") return child;
      if ("children" in child)
        for (const nested of [...child.children].reverse()) {
          const found = lastParagraph(nested);
          if (found) return found;
        }
    };
    node.children.forEach((child, index) => {
      if (index && child.style.keepPrevious) {
        const previous = lastParagraph(node.children[index - 1]);
        if (previous) previous.style.keepNext = true;
      }
    });
    if (
      node.kind !== "group" ||
      !node.style.keepTogether ||
      node.style.background ||
      node.style.borders[1] ||
      node.style.borders[3]
    )
      return;
    const paragraphs: Array<Extract<DocumentLayout, { kind: "paragraph" }>> =
      [];
    const collect = (child: DocumentLayout) => {
      if (child.kind === "paragraph") paragraphs.push(child);
      else if ("children" in child) child.children.forEach(collect);
    };
    collect(node);
    paragraphs.slice(0, -1).forEach((paragraph) => {
      paragraph.style.keepNext = true;
    });
  }
  retainShortGroups(layout);
  function run(value: LayoutRun): ParagraphChild {
    const href = value.href && safeDocumentLink(value.href);
    const text = new TextRun({
      text: value.text,
      font:
        value.bold && headingFontData ? "Pretendard SemiBold" : "Pretendard",
      bold: value.bold && !headingFontData,
      italics: value.italic,
      color: value.color,
      size: Math.max(14, Math.round(value.size * 1.5)),
      underline: value.underline || href ? { type: "single" } : undefined,
      shading: value.background
        ? { type: ShadingType.CLEAR, fill: value.background, color: "auto" }
        : undefined,
    });
    return href
      ? new ExternalHyperlink({ link: href, children: [text] })
      : text;
  }
  function spacer(height: number) {
    return new Paragraph({
      keepNext: true,
      spacing: {
        before: 0,
        after: 0,
        line: Math.max(1, twips(height)),
        lineRule: "exact",
      },
      children: [],
    });
  }
  function render(node: DocumentLayout, width: number, boxed = false): Child[] {
    const style = node.style;
    if (node.kind === "image")
      return [
        new Paragraph({
          spacing: {
            before: twips(style.margin[0]),
            after: twips(style.margin[2]),
          },
          keepNext: true,
          children: [
            new ImageRun({
              data: bytes(node.data),
              type: "png",
              transformation: {
                width: Math.min(style.width, width / 15),
                height:
                  (Math.min(style.width, width / 15) * style.height) /
                  Math.max(1, style.width),
              },
              altText: {
                title: node.alt,
                description: node.alt,
                name: "Document image",
              },
            }),
          ],
        }),
      ];
    const hasBox =
      style.background ||
      style.borders.some(Boolean) ||
      (node.kind === "group" && style.keepTogether);
    // Section rules stay in normal document flow; wrapping an entire section in
    // a nested Word table can move otherwise short sections to separate pages.
    if (
      node.kind === "group" &&
      !boxed &&
      !style.keepTogether &&
      !style.background &&
      !style.borders[1] &&
      !style.borders[3] &&
      (style.borders[0] || style.borders[2])
    ) {
      const rule = (edge: "top" | "bottom") =>
        new Paragraph({
          keepNext: edge === "top",
          spacing: { before: 0, after: 0, line: 1, lineRule: "exact" },
          border: { [edge]: borders(style)[edge] },
          children: [],
        });
      return [
        ...(style.margin[0] ? [spacer(style.margin[0])] : []),
        ...(style.borders[0] ? [rule("top")] : []),
        ...(style.padding[0] ? [spacer(style.padding[0])] : []),
        ...node.children.flatMap((child) => render(child, width)),
        ...(style.padding[2] ? [spacer(style.padding[2])] : []),
        ...(style.borders[2] ? [rule("bottom")] : []),
        ...(style.margin[2] ? [spacer(style.margin[2])] : []),
      ];
    }
    if (hasBox && !boxed && !(node.kind === "paragraph" && node.heading)) {
      const children = render(
        node,
        width - twips(style.padding[1] + style.padding[3]),
        true,
      );
      return [
        ...(style.margin[0] ? [spacer(style.margin[0])] : []),
        new Table({
          width: { size: width, type: WidthType.DXA },
          columnWidths: [width],
          layout: TableLayoutType.FIXED,
          borders: noBorders,
          rows: [
            new TableRow({
              cantSplit: style.keepTogether,
              children: [
                new TableCell({
                  children: children.length ? children : [spacer(1)],
                  width: { size: width, type: WidthType.DXA },
                  borders: borders(style),
                  shading: style.background
                    ? {
                        type: ShadingType.CLEAR,
                        fill: style.background,
                        color: "auto",
                      }
                    : undefined,
                  margins: {
                    top: twips(style.padding[0]),
                    right: twips(style.padding[1]),
                    bottom: twips(style.padding[2]),
                    left: twips(style.padding[3]),
                  },
                  verticalAlign: VerticalAlign.TOP,
                }),
              ],
            }),
          ],
        }),
        spacer(Math.max(2, style.margin[2])),
      ];
    }
    if (node.kind === "paragraph") {
      if (!node.runs.some((value) => value.text.trim())) return [];
      const heading =
        node.heading === 1
          ? HeadingLevel.TITLE
          : node.heading === 2
            ? HeadingLevel.HEADING_1
            : node.heading
              ? HeadingLevel.HEADING_2
              : undefined;
      return [
        new Paragraph({
          heading,
          children: node.runs.map(run),
          alignment:
            style.align === "center"
              ? AlignmentType.CENTER
              : style.align === "right"
                ? AlignmentType.RIGHT
                : AlignmentType.LEFT,
          keepNext: style.keepNext || Boolean(heading),
          keepLines: Boolean(heading),
          widowControl: true,
          bullet: node.bullet
            ? { level: Math.min(node.level ?? 0, 8) }
            : undefined,
          spacing: {
            before: boxed ? 0 : twips(style.margin[0] + style.padding[0]),
            after: boxed ? 0 : twips(style.margin[2] + style.padding[2]),
            line: twips(style.lineHeight),
            lineRule: "exact",
          },
          indent:
            !node.bullet && !boxed && (style.padding[3] || style.margin[3])
              ? {
                  left: twips(style.margin[3] + style.padding[3]),
                  right: twips(style.padding[1]),
                }
              : undefined,
          border: boxed ? noBorders : borders(style),
          shading:
            style.background && !boxed
              ? {
                  type: ShadingType.CLEAR,
                  fill: style.background,
                  color: "auto",
                }
              : undefined,
        }),
      ];
    }
    if (!node.children.length) return [];
    if (node.kind === "columns") {
      const rows: TableRow[] = [];
      const count = node.columns;
      // Measure proportional widths from the actual print layout, including asymmetric header columns.
      const first = node.children.slice(0, count);
      // Native font metrics vary slightly from CSS. Give intrinsic flex labels
      // room to stay on one line, taking the allowance from flexible gutters.
      const desired = first.map(
        (child) => child.style.width + (node.intrinsic ? 8 : 0),
      );
      const total = desired.reduce((sum, value) => sum + value, 0) || count;
      const tableWidth = Math.min(
        width,
        twips(style.width + (node.intrinsic ? count * 8 : 0)),
      );
      const gap = Math.round(
        Math.min(
          twips(node.gap),
          Math.max(0, (tableWidth - twips(total)) / (count - 1)),
        ),
      );
      const available = tableWidth - gap * (count - 1);
      const widths = desired.map((value) =>
        Math.max(100, Math.round((available * value) / total)),
      );
      const grid = widths.flatMap((value, index) =>
        index < count - 1 ? [value, gap] : [value],
      );
      for (let offset = 0; offset < node.children.length; offset += count) {
        const cells: TableCell[] = [];
        for (let index = 0; index < count; index++) {
          const child = node.children[offset + index];
          const cellStyle = child?.style;
          const cellWidth = widths[index];
          const children = child
            ? render(
                child,
                cellWidth -
                  twips(
                    (cellStyle?.padding[1] ?? 0) + (cellStyle?.padding[3] ?? 0),
                  ),
                true,
              )
            : [];
          cells.push(
            new TableCell({
              width: { size: cellWidth, type: WidthType.DXA },
              children: children.length ? children : [spacer(1)],
              borders: cellStyle ? borders(cellStyle) : noBorders,
              shading: cellStyle?.background
                ? {
                    type: ShadingType.CLEAR,
                    fill: cellStyle.background,
                    color: "auto",
                  }
                : undefined,
              margins: {
                top: twips(cellStyle?.padding[0] ?? 0),
                right: twips(cellStyle?.padding[1] ?? 0),
                bottom: twips(cellStyle?.padding[2] ?? 0),
                left: twips(cellStyle?.padding[3] ?? 0),
              },
              verticalAlign: VerticalAlign.TOP,
            }),
          );
          if (index < count - 1)
            cells.push(
              new TableCell({
                width: { size: gap, type: WidthType.DXA },
                children: [spacer(1)],
                borders: noBorders,
                margins: { top: 0, right: 0, bottom: 0, left: 0 },
              }),
            );
        }
        rows.push(
          new TableRow({
            cantSplit: node.children
              .slice(offset, offset + count)
              .every((child) => child.style.height < 700),
            children: cells,
          }),
        );
        if (offset + count < node.children.length)
          rows.push(
            new TableRow({
              children: grid.map(
                (value) =>
                  new TableCell({
                    width: { size: value, type: WidthType.DXA },
                    children: [spacer(node.gap)],
                    borders: noBorders,
                    margins: { top: 0, right: 0, bottom: 0, left: 0 },
                  }),
              ),
            }),
          );
      }
      return [
        ...(style.margin[0] && !boxed ? [spacer(style.margin[0])] : []),
        new Table({
          width: { size: tableWidth, type: WidthType.DXA },
          columnWidths: grid,
          layout: TableLayoutType.FIXED,
          borders: noBorders,
          rows,
        }),
        spacer(Math.max(2, boxed ? 0 : style.margin[2])),
      ];
    }
    return [
      ...(!boxed && style.margin[0] ? [spacer(style.margin[0])] : []),
      ...node.children.flatMap((child) => render(child, width)),
      ...(!boxed && style.margin[2] ? [spacer(style.margin[2])] : []),
    ];
  }
  return Packer.toBlob(
    createDesignedDocument({
      children: render(layout, DOCUMENT_PAGE.width - DOCUMENT_PAGE.margin * 2),
      title,
      locale,
      fontData,
      headingFontData,
      templateLayout: true,
    }),
  );
}
