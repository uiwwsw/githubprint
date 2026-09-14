import {
  DOCUMENT_TAGS,
  documentBase64,
  type DocumentElement,
  type DocumentVisualSnapshot,
} from "@/lib/document-html";
import { readDocumentImage } from "@/lib/document-avatar";
import { WORD_LAYOUT_FONTS } from "@/lib/document-fonts";

const SKIP =
  ".screen-only,[data-export-ignore],script,style,template,iframe,object,embed,form,input,button,select,textarea,svg";
const normalizeFamily = (family: string) =>
  family.replace(/["']/g, "").trim().toLowerCase();

function includesCharacters(range: string, text: string) {
  if (!range) return true;
  return range.split(",").some((value) => {
    const pattern = value.trim().replace(/^U\+/i, "");
    const [start, end = start] = pattern.includes("?")
      ? [pattern.replace(/\?/g, "0"), pattern.replace(/\?/g, "F")]
      : pattern.split("-");
    const first = parseInt(start, 16),
      last = parseInt(end, 16);
    return [...text].some((character) => {
      const code = character.codePointAt(0)!;
      return code >= first && code <= last;
    });
  });
}

/** Bundle only fonts used by this document, including its Korean glyph ranges. */
async function captureStyles(
  root: HTMLElement,
  signal: AbortSignal,
  embedFonts: boolean,
) {
  const elements = [root, ...root.querySelectorAll<HTMLElement>("*")];
  const families = new Set(
    elements
      .filter((el) => !el.closest(SKIP))
      .map((el) =>
        normalizeFamily(getComputedStyle(el).fontFamily.split(",")[0]),
      ),
  );
  const characters = root.textContent ?? "";
  const assets = new Map<string, Promise<string>>();
  async function embedFont(url: string, base: string) {
    const resolved = new URL(url, base);
    if (
      resolved.origin !== location.origin ||
      !/\.(woff2?|ttf|otf)$/i.test(resolved.pathname)
    )
      throw new Error("Unsupported document font");
    let promise = assets.get(resolved.href);
    if (!promise) {
      promise = fetch(resolved, {
        signal: AbortSignal.any([signal, AbortSignal.timeout(15_000)]),
      }).then(async (response) => {
        if (!response.ok) throw new Error("Document font is unavailable");
        const bytes = new Uint8Array(await response.arrayBuffer());
        if (bytes.length > 15_000_000)
          throw new Error("Document font exceeds size limit");
        return `data:font/${resolved.pathname.endsWith("woff2") ? "woff2" : resolved.pathname.endsWith("woff") ? "woff" : "ttf"};base64,${documentBase64(bytes)}`;
      });
      assets.set(resolved.href, promise);
    }
    return promise;
  }
  async function ruleText(
    rule: CSSRule,
    base: string,
    print: boolean,
  ): Promise<string> {
    if (rule.type === CSSRule.IMPORT_RULE) {
      const imported = rule as CSSImportRule;
      if (!imported.styleSheet)
        throw new Error("Document stylesheet is unavailable");
      return rulesText(imported.styleSheet.cssRules, imported.href, print);
    }
    if (rule.type === CSSRule.FONT_FACE_RULE) {
      if (!embedFonts) return "";
      const font = rule as CSSFontFaceRule;
      if (
        !families.has(
          normalizeFamily(font.style.getPropertyValue("font-family")),
        ) ||
        !includesCharacters(
          font.style.getPropertyValue("unicode-range"),
          characters,
        )
      )
        return "";
      let css = font.cssText;
      for (const match of [
        ...css.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g),
      ])
        css = css.replace(
          match[0],
          `url("${await embedFont(match[1], base)}")`,
        );
      return css;
    }
    // Style and @page rules have declarations as well as nested rules. Reading
    // only cssRules would silently discard A4 size/margins and normal styles.
    if (rule.type === CSSRule.STYLE_RULE || rule.type === CSSRule.PAGE_RULE)
      return rule.cssText.replace(/url\([^)]*\)/g, "none");
    if ("cssRules" in rule) {
      const group = rule as CSSGroupingRule;
      const body = await rulesText(group.cssRules, base, print);
      if (rule.type === CSSRule.MEDIA_RULE && print) {
        const media = (rule as CSSMediaRule).conditionText;
        if (/\bprint\b/.test(media) && !/not\s+print/.test(media)) return body;
        if (/\bscreen\b/.test(media)) return "";
      }
      return `${rule.cssText.slice(0, rule.cssText.indexOf("{"))}{${body}}`;
    }
    // App CSS is trusted, but no leftover remote resource may enter an offline file.
    return rule.cssText.replace(/url\([^)]*\)/g, "none");
  }
  async function rulesText(rules: CSSRuleList, base: string, print: boolean) {
    return (
      await Promise.all(
        Array.from(rules, (rule) => ruleText(rule, base, print)),
      )
    ).join("\n");
  }
  const sheets = Array.from(document.styleSheets).filter(
    (sheet) => !sheet.href || new URL(sheet.href).origin === location.origin,
  );
  if (!sheets.length) throw new Error("Document styles are unavailable");
  const [css, printCss] = await Promise.all(
    [false, true].map(async (print) =>
      (
        await Promise.all(
          sheets.map((sheet) =>
            rulesText(sheet.cssRules, sheet.href ?? location.href, print),
          ),
        )
      ).join("\n"),
    ),
  );
  const fontOverride = embedFonts
    ? ""
    : `\n[data-document], [data-document] * { font-family: ${WORD_LAYOUT_FONTS} !important; }`;
  return { css: css + fontOverride, printCss: printCss + fontOverride };
}

export async function snapshotVisualDocument(
  root: HTMLElement,
  signal: AbortSignal,
  options: { embedFonts?: boolean } = {},
): Promise<{ snapshot: DocumentVisualSnapshot; imageMissing: boolean }> {
  await document.fonts.ready;
  const styles = await captureStyles(
    root,
    signal,
    options.embedFonts !== false,
  );
  const images = new Map<HTMLImageElement, string>();
  let imageMissing = false;
  await Promise.all(
    Array.from(root.querySelectorAll<HTMLImageElement>("img"))
      .filter((image) => !image.closest(SKIP))
      .map(async (image) => {
        try {
          images.set(
            image,
            `data:image/png;base64,${documentBase64(await readDocumentImage(image, signal))}`,
          );
        } catch {
          imageMissing = true;
        }
      }),
  );
  function capture(node: Node): DocumentElement | string | null {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
    if (node.nodeType !== Node.ELEMENT_NODE) return null;
    const element = node as HTMLElement;
    const tag = element.tagName.toLowerCase();
    if (element.matches(SKIP) || !DOCUMENT_TAGS.has(tag)) return null;
    const attrs = Object.fromEntries(
      Array.from(element.attributes).map((attribute) => [
        attribute.name,
        attribute.value,
      ]),
    );
    if (tag === "a")
      attrs.href = (element as HTMLAnchorElement)
        .getAttribute("href")
        ?.startsWith("#")
        ? attrs.href
        : (element as HTMLAnchorElement).href;
    if (tag === "img") {
      const source = images.get(element as HTMLImageElement);
      if (!source) return null;
      attrs.src = source;
    }
    return {
      tag,
      attrs,
      children: Array.from(element.childNodes)
        .map(capture)
        .filter((child): child is DocumentElement | string => child !== null),
    };
  }
  return {
    snapshot: {
      root: capture(root) as DocumentElement,
      ...styles,
      density: document.documentElement.dataset.printDensity ?? "comfortable",
    },
    imageMissing,
  };
}
