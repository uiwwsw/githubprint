import { test, expect } from "@playwright/test";
import JSZip from "jszip";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";

const output = path.join(process.cwd(), ".cache/document-qa");
const plain = (value: string) => value.replace(/\s+/g, "");
const unescapeXml = (value: string) =>
  value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");

for (const locale of ["ko", "en"] as const) {
  for (const template of ["brief", "profile", "insight", "resume"] as const) {
    test(`${locale} ${template} exports the preview text, A4 styles, links and embedded Korean fonts`, async ({
      page,
    }) => {
      await mkdir(output, { recursive: true });
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      const response = await page.goto(
        `${locale === "en" ? "/en" : ""}/preview?template=${template}`,
      );
      expect(response?.status()).toBe(200);
      await expect(page.locator("[data-document]")).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      const expectedText = await page
        .locator("[data-document]")
        .evaluate((root) => {
          return Array.from(root.querySelectorAll("h1,h2,h3,h4,h5,p,li,a,span"))
            .filter((el) => !el.closest("[data-export-ignore], .screen-only"))
            .map((el) => el.textContent?.trim() ?? "")
            .filter(Boolean);
        });
      const [download] = await Promise.all([
        page.waitForEvent("download"),
        page
          .getByRole("button", {
            name: locale === "ko" ? "Word로 저장" : "Save Word",
          })
          .click(),
      ]);
      const filename = `${template}-${locale}`;
      await download.saveAs(path.join(output, `${filename}.docx`));
      expect(await download.failure()).toBeNull();
      expect(download.suggestedFilename()).toBe(
        `githubprint-example-${template}-2026-09-01.docx`,
      );
      const zip = await JSZip.loadAsync(
        await readFile(path.join(output, `${filename}.docx`)),
      );
      const xml = await zip.file("word/document.xml")!.async("string");
      const text = plain(
        unescapeXml(
          [...xml.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g)]
            .map((match) => match[1])
            .join(""),
        ),
      );
      for (const expected of expectedText)
        expect(text, `Missing preview text: ${expected}`).toContain(
          plain(expected),
        );
      expect(xml).toContain('w:w="11906"');
      expect(xml).toContain('w:h="16838"');
      expect(xml).toContain('w:pStyle w:val="Title"');
      expect(xml).toContain('w:pStyle w:val="Heading1"');
      expect(xml).toContain("w:keepNext");
      expect(xml).toContain("w:widowControl");
      const fonts = await zip.file("word/fontTable.xml")!.async("string");
      expect(fonts).toContain("w:embedRegular");
      expect(
        (await zip.file("word/fonts/Pretendard.odttf")!.async("uint8array"))
          .length,
      ).toBeGreaterThan(100_000);
      expect(
        Object.keys(zip.files).filter((key) => key.endsWith(".odttf")),
      ).toHaveLength(2);
      if ((await page.locator("[data-document] img").count()) > 0) {
        expect(
          Object.keys(zip.files).some(
            (key) => key.startsWith("word/media/") && key.endsWith(".png"),
          ),
        ).toBe(true);
      }
      const footer = await zip.file("word/footer1.xml")!.async("string");
      expect(footer).toContain("PAGE");
      expect(footer).toContain("NUMPAGES");
      await page.pdf({
        path: path.join(output, `${filename}.pdf`),
        preferCSSPageSize: true,
        printBackground: true,
        tagged: true,
      });
      await page.screenshot({
        path: path.join(output, `${filename}-screen.png`),
        fullPage: true,
      });
      expect(errors).toEqual([]);
    });
  }
}

test("mobile home, templates and toolbar fit without horizontal scrolling", async ({
  page,
}) => {
  for (const width of [360, 390]) {
    await page.setViewportSize({ width, height: 844 });
    for (const route of [
      "/",
      "/en",
      "/preview?template=resume",
      "/en/preview?template=profile",
    ]) {
      await page.goto(route);
      await page.evaluate(() => document.fonts.ready);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - innerWidth,
      );
      expect(overflow, `${route} at ${width}px`).toBeLessThanOrEqual(1);
      if (width === 390)
        await page.screenshot({
          path: path.join(
            output,
            `mobile-${route === "/" ? "home" : route.replace(/[^a-z]/g, "")}.png`,
          ),
          fullPage: true,
        });
    }
  }
});

test("PDF uses the filename and restores the title after print, including a cancelled dialog", async ({
  page,
}) => {
  await page.goto("/preview?template=resume");
  const originalTitle = await page.title();
  await page.evaluate(() => {
    window.print = () => {
      document.documentElement.dataset.testPrintTitle = document.title;
      window.dispatchEvent(new Event("afterprint"));
    };
  });
  await page.getByRole("button", { name: "PDF로 저장" }).click();
  await expect(page.getByRole("button", { name: "PDF로 저장" })).toBeEnabled();
  expect(await page.title()).toBe(originalTitle);
  expect(await page.locator("html").getAttribute("data-test-print-title")).toBe(
    "githubprint-example-resume-2026-09-01",
  );
  await page.getByLabel("PDF 간격").selectOption("compact");
  await page.emulateMedia({ media: "print" });
  expect(
    await page
      .locator("[data-document]")
      .evaluate((el) =>
        getComputedStyle(el).getPropertyValue("--document-gap").trim(),
      ),
  ).toBe("9pt");
  await page.emulateMedia({ media: "screen" });
  await page.getByRole("link", { name: "Profile", exact: true }).click();
  await expect(page.locator("html")).not.toHaveAttribute("data-print-density");
});

test("download failure is actionable and the button can be retried", async ({
  page,
}) => {
  await page.goto("/preview?template=resume");
  await page.route("**/fonts/Pretendard-Regular.ttf", (route) =>
    route.fulfill({ status: 503, body: "Unavailable" }),
  );
  await page.getByRole("button", { name: "Word로 저장" }).click();
  await expect(page.locator(".screen-toolbar [role=alert]")).toContainText(
    "다시 시도",
  );
  await expect(page.getByRole("button", { name: "Word로 저장" })).toBeEnabled();
});

test("long entries keep every paragraph and only safe hyperlink targets", async ({
  page,
}) => {
  await page.goto("/preview?template=resume");
  await page.locator("[data-document]").evaluate((root) => {
    const article = document.createElement("article");
    const heading = document.createElement("h2");
    heading.textContent = "긴 프로젝트 상세";
    article.append(heading);
    for (let i = 0; i < 55; i++) {
      const p = document.createElement("p");
      p.textContent = `검증 문단 ${i} — 긴 문서에서도 한글과 TypeScript 설명을 누락 없이 전달합니다. 프로젝트 구성, 접근성, 사용자 흐름을 설명하는 예시 문장입니다.`;
      article.append(p);
    }
    const link = document.createElement("a");
    link.href = "javascript:alert(1)";
    link.textContent = "안전하지 않은 링크의 표시 문구";
    article.append(link);
    root.append(article);
  });
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Word로 저장" }).click(),
  ]);
  await download.saveAs(path.join(output, "stress-ko.docx"));
  const zip = await JSZip.loadAsync(
    await readFile(path.join(output, "stress-ko.docx")),
  );
  const xml = await zip.file("word/document.xml")!.async("string");
  for (let i = 0; i < 55; i++) expect(xml).toContain(`검증 문단 ${i}`);
  expect(xml).toContain("안전하지 않은 링크의 표시 문구");
  expect(
    await zip.file("word/_rels/document.xml.rels")!.async("string"),
  ).not.toContain("javascript:");
  await page.pdf({
    path: path.join(output, "stress-ko.pdf"),
    preferCSSPageSize: true,
    printBackground: true,
  });
});
