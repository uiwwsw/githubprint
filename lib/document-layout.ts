import {
  buildDocumentHtml,
  type DocumentVisualSnapshot,
} from "@/lib/document-html";
import { safeDocumentLink } from "@/lib/document-snapshot";
import type { Locale } from "@/lib/schemas";

export type LayoutBorder = { color: string; width: number };
export type LayoutStyle = {
  width: number;
  height: number;
  color: string;
  background?: string;
  fontSize: number;
  lineHeight: number;
  bold: boolean;
  italic: boolean;
  align: string;
  margin: number[];
  padding: number[];
  borders: Array<LayoutBorder | null>;
  keepNext: boolean;
  keepPrevious?: boolean;
  keepTogether: boolean;
};
export type LayoutRun = {
  text: string;
  href?: string;
  color: string;
  background?: string;
  size: number;
  bold: boolean;
  italic: boolean;
  underline: boolean;
};
export type DocumentLayout =
  | {
      kind: "paragraph";
      style: LayoutStyle;
      runs: LayoutRun[];
      heading?: number;
      bullet?: boolean;
      level?: number;
    }
  | { kind: "image"; style: LayoutStyle; data: string; alt: string }
  | { kind: "group"; style: LayoutStyle; children: DocumentLayout[] }
  | {
      kind: "columns";
      style: LayoutStyle;
      columns: number;
      gap: number;
      intrinsic?: boolean;
      children: DocumentLayout[];
    };

const BLOCK =
  /^(H[1-6]|P|UL|OL|LI|DIV|SECTION|ARTICLE|HEADER|FOOTER|ASIDE|DL|DT|DD|BLOCKQUOTE|PRE|TABLE|TR|TD|TH|IMG|HR)$/;

/** Measure the same A4 print CSS as PDF, without changing the user's preview or viewport. */
export async function snapshotDocumentLayout(
  snapshot: DocumentVisualSnapshot,
  locale: Locale,
  signal: AbortSignal,
): Promise<DocumentLayout> {
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.tabIndex = -1;
  frame.sandbox.add("allow-same-origin");
  frame.style.cssText =
    "position:fixed;left:-10000px;top:0;width:794px;height:1123px;border:0;pointer-events:none;visibility:hidden";
  const loaded = new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(
      () => reject(new Error("Document layout timed out")),
      15_000,
    );
    const abort = () => {
      clearTimeout(timeout);
      reject(new Error("Document export cancelled"));
    };
    signal.addEventListener("abort", abort, { once: true });
    frame.onload = () => {
      clearTimeout(timeout);
      signal.removeEventListener("abort", abort);
      resolve();
    };
  });
  try {
    frame.srcdoc = buildDocumentHtml({
      snapshot,
      locale,
      title: "Document layout",
      fontLicense: "",
      printLayout: true,
    });
    document.body.append(frame);
    await loaded;
    const doc = frame.contentDocument;
    const view = frame.contentWindow;
    if (!doc || !view || signal.aborted)
      throw new Error("Document layout is unavailable");
    await doc.fonts.ready;
    const root = doc.querySelector<HTMLElement>("[data-document]");
    if (!root) throw new Error("Document layout is empty");
    const canvas = doc.createElement("canvas");
    canvas.width = canvas.height = 1;
    const context = canvas.getContext("2d")!;
    const colors = new Map<string, string | undefined>();
    function color(value: string): string | undefined {
      if (colors.has(value)) return colors.get(value);
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = value;
      context.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data;
      const hex =
        a === 0
          ? undefined
          : [r, g, b]
              .map((channel) =>
                Math.round((channel * a) / 255 + 255 - a)
                  .toString(16)
                  .padStart(2, "0"),
              )
              .join("")
              .toUpperCase();
      colors.set(value, hex);
      return hex;
    }
    const px = (value: string) => parseFloat(value) || 0;
    function style(element: HTMLElement): LayoutStyle {
      const css = view!.getComputedStyle(element),
        bounds = element.getBoundingClientRect();
      const edges = ["Top", "Right", "Bottom", "Left"] as const;
      return {
        width: bounds.width,
        height: bounds.height,
        color: color(css.color) ?? "111916",
        background: color(css.backgroundColor),
        fontSize: px(css.fontSize),
        lineHeight: px(css.lineHeight) || px(css.fontSize) * 1.5,
        bold: Number(css.fontWeight) >= 600,
        italic: css.fontStyle === "italic",
        align: css.textAlign,
        margin: edges.map((edge) => px(css[`margin${edge}`])),
        padding: edges.map((edge) => px(css[`padding${edge}`])),
        borders: edges.map((edge) => {
          const width = px(css[`border${edge}Width`]),
            fill = color(css[`border${edge}Color`]);
          return width && fill ? { color: fill, width } : null;
        }),
        keepNext: css.breakAfter.includes("avoid"),
        keepPrevious: css.breakBefore.includes("avoid"),
        keepTogether: css.breakInside.includes("avoid") && bounds.height < 800,
      };
    }
    function inline(
      node: Node,
      parent: HTMLElement,
      href?: string,
    ): LayoutRun[] {
      if (node.nodeType === 3) {
        const css = view!.getComputedStyle(parent);
        let text = (node.textContent ?? "").replace(/[\t\r ]+/g, " ");
        if (css.textTransform === "uppercase")
          text = text.toLocaleUpperCase(locale);
        else if (css.textTransform === "lowercase")
          text = text.toLocaleLowerCase(locale);
        else if (css.textTransform === "capitalize")
          text = text.replace(/\b\p{L}/gu, (letter) =>
            letter.toLocaleUpperCase(locale),
          );
        return [
          {
            text,
            href,
            color: color(css.color) ?? "111916",
            background: color(css.backgroundColor),
            size: px(css.fontSize),
            bold:
              Number(css.fontWeight) >= 600 ||
              /^(B|STRONG)$/.test(parent.tagName),
            italic: css.fontStyle === "italic",
            underline: css.textDecorationLine.includes("underline"),
          },
        ];
      }
      if (node.nodeType !== 1) return [];
      const element = node as HTMLElement;
      if (/^(IMG|UL|OL)$/.test(element.tagName)) return [];
      if (element.tagName === "BR")
        return [
          { ...inline(doc!.createTextNode(" "), parent, href)[0], text: "\n" },
        ];
      const link =
        element.tagName === "A"
          ? safeDocumentLink((element as HTMLAnchorElement).href)
          : href;
      const runs = Array.from(element.childNodes).flatMap((child) =>
        inline(child, element, link),
      );
      if (/^(SPAN|A)$/.test(element.tagName) && runs.length)
        runs.push({
          ...runs[runs.length - 1],
          text: "  ",
          href: undefined,
          background: undefined,
        });
      return runs;
    }
    function paragraph(
      element: HTMLElement,
      runs = inline(element, element),
    ): DocumentLayout {
      const heading = /^H([1-6])$/.exec(element.tagName);
      let level = -1;
      for (
        let ancestor = element.parentElement;
        ancestor;
        ancestor = ancestor.parentElement
      )
        if (/^(UL|OL)$/.test(ancestor.tagName)) level++;
      return {
        kind: "paragraph",
        style: style(element),
        runs,
        heading: heading ? Number(heading[1]) : undefined,
        bullet:
          element.tagName === "LI" &&
          element.parentElement?.tagName !== "OL" &&
          view!.getComputedStyle(element).listStyleType !== "none",
        level: Math.max(0, level),
      };
    }
    function walk(element: HTMLElement): DocumentLayout | null {
      const css = view!.getComputedStyle(element);
      if (css.display === "none") return null;
      const box = style(element);
      if (element.tagName === "IMG") {
        const image = element as HTMLImageElement;
        const raster = doc!.createElement("canvas");
        raster.width = Math.max(1, Math.round(box.width * 3));
        raster.height = Math.max(1, Math.round(box.height * 3));
        const painter = raster.getContext("2d")!;
        painter.scale(3, 3);
        painter.beginPath();
        painter.roundRect(
          0,
          0,
          box.width,
          box.height,
          [
            css.borderTopLeftRadius,
            css.borderTopRightRadius,
            css.borderBottomRightRadius,
            css.borderBottomLeftRadius,
          ].map((value) =>
            value.endsWith("%")
              ? (Math.min(box.width, box.height) * px(value)) / 100
              : px(value),
          ),
        );
        painter.clip();
        const ratio =
          css.objectFit === "cover"
            ? Math.max(
                box.width / image.naturalWidth,
                box.height / image.naturalHeight,
              )
            : css.objectFit === "contain"
              ? Math.min(
                  box.width / image.naturalWidth,
                  box.height / image.naturalHeight,
                )
              : 0;
        const width = ratio ? image.naturalWidth * ratio : box.width;
        const height = ratio ? image.naturalHeight * ratio : box.height;
        painter.drawImage(
          image,
          (box.width - width) / 2,
          (box.height - height) / 2,
          width,
          height,
        );
        return {
          kind: "image",
          style: box,
          data: raster.toDataURL("image/png"),
          alt: image.alt,
        };
      }
      if (/^(H[1-6]|P|LI|DT|DD|PRE|BLOCKQUOTE)$/.test(element.tagName)) {
        const content = paragraph(element);
        if (
          element.tagName === "LI" &&
          element.parentElement?.tagName === "OL" &&
          content.kind === "paragraph"
        ) {
          const index =
            Array.from(element.parentElement.children).indexOf(element) +
            Number(element.parentElement.getAttribute("start") ?? 1);
          if (content.runs.length)
            content.runs.unshift({
              ...content.runs[0],
              text: `${index}. `,
              href: undefined,
            });
        }
        const nested = Array.from(element.children)
          .filter((child) => /^(UL|OL)$/.test(child.tagName))
          .map((child) => walk(child as HTMLElement))
          .filter((node): node is DocumentLayout => Boolean(node));
        return nested.length
          ? {
              kind: "group",
              style: {
                ...box,
                background: undefined,
                borders: [null, null, null, null],
                padding: [0, 0, 0, 0],
              },
              children: [content, ...nested],
            }
          : content;
      }
      if (
        !Array.from(element.children).some((child) => BLOCK.test(child.tagName))
      ) {
        const content = paragraph(element);
        return content.kind === "paragraph" &&
          content.runs.some((run) => run.text.trim())
          ? content
          : null;
      }
      const children: DocumentLayout[] = [];
      let pending: LayoutRun[] = [];
      const flush = () => {
        if (pending.some((run) => run.text.trim()))
          children.push(paragraph(element, pending));
        pending = [];
      };
      for (const child of Array.from(element.childNodes)) {
        if (
          child.nodeType === 1 &&
          (BLOCK.test((child as HTMLElement).tagName) ||
            css.display === "flex" ||
            css.display === "grid")
        ) {
          flush();
          const captured = walk(child as HTMLElement);
          if (captured) children.push(captured);
        } else pending.push(...inline(child, element));
      }
      flush();
      const floatingImage = Array.from(element.children).find(
        (child) =>
          child.tagName === "IMG" &&
          view!.getComputedStyle(child).float === "right",
      ) as HTMLImageElement | undefined;
      if (floatingImage && children.length > 1) {
        const image = children.find((child) => child.kind === "image");
        if (image) {
          const gap = image.style.margin[3];
          const contentStyle = {
            ...box,
            width: Math.max(1, box.width - image.style.width - gap),
            background: undefined,
            borders: [null, null, null, null],
            margin: [0, 0, 0, 0],
            padding: [0, 0, 0, 0],
          };
          return {
            kind: "columns",
            style: box,
            columns: 2,
            intrinsic: true,
            gap,
            children: [
              {
                kind: "group",
                style: contentStyle,
                children: children.filter((child) => child !== image),
              },
              image,
            ],
          };
        }
      }
      const columns =
        css.display === "grid"
          ? css.gridTemplateColumns
              .split(/\s+/)
              .filter((value) => value.endsWith("px")).length
          : css.display === "flex" && css.flexDirection.startsWith("row")
            ? children.length
            : 1;
      if (columns > 1 && children.length > 1) {
        const contentWidth = children
          .slice(0, columns)
          .reduce((sum, child) => sum + child.style.width, 0);
        const gap =
          css.display === "flex" && css.justifyContent === "space-between"
            ? Math.max(
                px(css.columnGap),
                (box.width - contentWidth) / (columns - 1),
              )
            : px(css.columnGap);
        const width =
          css.display === "flex"
            ? Math.min(box.width, contentWidth + gap * (columns - 1))
            : box.width;
        return {
          kind: "columns",
          style: { ...box, width },
          columns,
          intrinsic: css.display === "flex",
          gap,
          children,
        };
      }
      return { kind: "group", style: box, children };
    }
    const layout = walk(root)!;
    layout.style.background = undefined;
    layout.style.borders = [null, null, null, null];
    return layout;
  } finally {
    frame.remove();
  }
}
