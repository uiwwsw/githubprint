export type DocumentRun = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  href?: string;
};
export type DocumentBlock = {
  kind:
    "title" | "heading" | "subheading" | "paragraph" | "bullet" | "metadata";
  runs: DocumentRun[];
  keepNext?: boolean;
};

const SKIP =
  ".screen-only, [data-export-ignore], script, style, img, svg, button";
const BLOCK =
  /^(H[1-6]|P|UL|OL|LI|DIV|SECTION|ARTICLE|HEADER|FOOTER|ASIDE|DL|DT|DD)$/;

export function safeDocumentLink(value: string) {
  try {
    const url = new URL(value);
    return ["https:", "http:", "mailto:", "tel:"].includes(url.protocol)
      ? url.href
      : undefined;
  } catch {
    return undefined;
  }
}

/** Snapshot the visible document, so exports never re-fetch or re-analyze private data. */
export function snapshotDocument(root: HTMLElement): DocumentBlock[] {
  const blocks: DocumentBlock[] = [];
  function inline(
    node: Node,
    inherited: Omit<DocumentRun, "text"> = {},
  ): DocumentRun[] {
    if (node.nodeType === 3)
      return [{ ...inherited, text: node.textContent ?? "" }];
    if (node.nodeType !== 1) return [];
    const element = node as HTMLElement;
    if (element.matches(SKIP)) return [];
    if (element.tagName === "BR") return [{ text: "\n" }];
    const style = {
      ...inherited,
      ...(/^(STRONG|B)$/.test(element.tagName) ||
      element.classList.contains("font-medium") ||
      element.classList.contains("font-semibold")
        ? { bold: true }
        : {}),
      ...(/^(EM|I)$/.test(element.tagName) ? { italic: true } : {}),
      ...(element.tagName === "A"
        ? { href: safeDocumentLink((element as HTMLAnchorElement).href) }
        : {}),
    };
    const runs = Array.from(element.childNodes).flatMap((child) =>
      inline(child, style),
    );
    // Chips and metadata are separate values even when JSX provides no whitespace.
    if (element.tagName === "SPAN" || element.tagName === "A")
      runs.push({ text: "  " });
    return runs;
  }
  function add(kind: DocumentBlock["kind"], runs: DocumentRun[]) {
    const cleaned = runs.map((run) => ({
      ...run,
      text: run.text.replace(/[\t\r ]+/g, " "),
    }));
    if (
      cleaned
        .map((run) => run.text)
        .join("")
        .trim()
    )
      blocks.push({ kind, runs: cleaned });
  }
  function walk(element: HTMLElement) {
    if (element.matches(SKIP)) return;
    const tag = element.tagName;
    // Keep a short closing note with the preceding context instead of creating
    // a trailing page containing only the disclaimer.
    if (tag === "FOOTER" && blocks.length && (element.textContent?.length ?? 0) < 1200)
      blocks[blocks.length - 1].keepNext = true;
    if (element.hasAttribute("data-document-fact")) {
      const [label, value] = Array.from(element.children);
      if (label && value) {
        add("paragraph", [
          { text: `${label.textContent}: `, bold: true },
          ...inline(value),
        ]);
        return;
      }
    }
    if (/^H[1-6]$/.test(tag)) {
      add(
        tag === "H1" ? "title" : tag === "H2" ? "heading" : "subheading",
        inline(element),
      );
      return;
    }
    if (tag === "P" || tag === "LI" || tag === "DT" || tag === "DD") {
      const metadata =
        Boolean(element.closest("footer")) ||
        element.classList.contains("text-xs") ||
        element.className.includes("text-[11px]");
      const start = blocks.length;
      add(
        tag === "LI" ? "bullet" : metadata ? "metadata" : "paragraph",
        inline(element),
      );
      // Several existing templates use short, bold paragraphs as field labels.
      // Keep those labels with their values at a page boundary as well.
      if (
        tag === "P" &&
        blocks.length > start &&
        element.nextElementSibling &&
        (element.classList.contains("font-medium") ||
          element.classList.contains("font-semibold")) &&
        (element.textContent?.trim().length ?? 0) > 0 &&
        (element.textContent?.trim().length ?? 0) < 90
      )
        blocks[blocks.length - 1].keepNext = true;
      return;
    }
    const groupStart = blocks.length;
    let pending: DocumentRun[] = [];
    for (const node of Array.from(element.childNodes)) {
      if (node.nodeType === 1 && BLOCK.test((node as HTMLElement).tagName)) {
        add("paragraph", pending);
        pending = [];
        walk(node as HTMLElement);
      } else pending.push(...inline(node));
    }
    add("paragraph", pending);
    // Keep short entries intact; long entries must be able to flow across pages.
    if (
      (tag === "ARTICLE" || element.hasAttribute("data-document-group")) &&
      element !== root
    ) {
      const group = blocks.slice(groupStart);
      const length = group.reduce(
        (total, block) =>
          total + block.runs.reduce((n, run) => n + run.text.length, 0),
        0,
      );
      if (group.length <= 14 && length <= 1400)
        group.slice(0, -1).forEach((block) => {
          block.keepNext = true;
        });
    }
  }
  walk(root);
  return blocks;
}
