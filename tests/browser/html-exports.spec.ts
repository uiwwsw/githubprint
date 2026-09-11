import { test, expect } from "@playwright/test";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const output = path.join(process.cwd(), ".cache/html-qa");
const plain = (value: string) => value.replace(/\s+/g, "");

for (const locale of ["ko", "en"] as const) {
  for (const template of ["brief", "profile", "insight", "resume"] as const) {
    test(`${locale} ${template} HTML is complete, portable, readable offline and responsive`, async ({
      page,
      browser,
    }) => {
      await mkdir(output, { recursive: true });
      await page.goto(
        `${locale === "en" ? "/en" : ""}/preview?template=${template}`,
      );
      await page.evaluate(() => document.fonts.ready);
      const expected = await page.locator("[data-document]").evaluate((root) =>
        Array.from(root.querySelectorAll("h1,h2,h3,h4,h5,p,li,a,span"))
          .filter((el) => !el.closest("[data-export-ignore], .screen-only"))
          .map((el) => el.textContent?.trim() ?? "")
          .filter(Boolean),
      );
      const hasAvatar = await page.locator("[data-document] img").count();
      await page
        .getByRole("button", {
          name: locale === "ko" ? "저장·공유" : "Save & share",
        })
        .click();
      const [download] = await Promise.all([
        page.waitForEvent("download"),
        page
          .getByRole("button", {
            name: locale === "ko" ? "HTML로 저장" : "Save HTML",
          })
          .click(),
      ]);
      expect(download.suggestedFilename()).toBe(
        `githubprint-example-${template}-2026-09-01.html`,
      );
      const file = path.join(output, `${template}-${locale}.html`);
      await download.saveAs(file);
      expect(await download.failure()).toBeNull();
      await expect(page.getByRole("status")).toContainText(
        locale === "ko" ? "HTML 파일" : "HTML file",
      );
      const source = await readFile(file, "utf8");
      expect(source).not.toContain("<script");
      expect(source).not.toContain("/_next/");
      expect(source).not.toContain("/api/resume-asset");
      const offline = await browser.newContext({
        offline: true,
        viewport: { width: 1440, height: 1000 },
      });
      try {
        const reader = await offline.newPage();
        const requests: string[] = [];
        reader.on("request", (request) => {
          if (/^https?:/.test(request.url())) requests.push(request.url());
        });
        await reader.goto(pathToFileURL(file).href);
        await reader.evaluate(() => document.fonts.ready);
        expect(
          await reader.evaluate(() =>
            document.fonts.check('16px "Pretendard Variable"', "한글 résumé"),
          ),
        ).toBe(true);
        const text = plain(
          (await reader.locator("[data-document]").textContent()) ?? "",
        );
        for (const value of expected)
          expect(text, `Missing text: ${value}`).toContain(plain(value));
        expect(await reader.locator("h1").count()).toBe(1);
        expect(await reader.locator("article img").count()).toBe(
          hasAvatar ? 1 : 0,
        );
        if (hasAvatar)
          expect(
            await reader
              .locator("article img")
              .evaluate(
                (image: HTMLImageElement) =>
                  image.complete && image.naturalWidth > 0,
              ),
          ).toBe(true);
        // The exported document preserves the template, including cards, spacing, and type.
        const visual = async (target: typeof page) =>
          target.locator("[data-document]").evaluate((root) => {
            const origin = root.getBoundingClientRect();
            return [root, ...root.querySelectorAll("*")]
              .filter((el) => !el.closest(".screen-only,[data-export-ignore]"))
              .map((el) => {
                const r = el.getBoundingClientRect(),
                  s = getComputedStyle(el);
                return {
                  tag: el.tagName,
                  x: r.x - origin.x,
                  y: r.y - origin.y,
                  width: r.width,
                  height: r.height,
                  color: s.color,
                  background: s.backgroundColor,
                  font: s.fontFamily,
                  fontSize: s.fontSize,
                  fontWeight: s.fontWeight,
                  radius: s.borderRadius,
                  display: s.display,
                };
              });
          });
        const original = await visual(page),
          exported = await visual(reader);
        expect(exported.length).toBe(original.length);
        for (let i = 0; i < original.length; i++) {
          for (const key of [
            "tag",
            "color",
            "background",
            "font",
            "fontSize",
            "fontWeight",
            "radius",
            "display",
          ] as const)
            expect(exported[i][key], `${i} ${original[i].tag} ${key}`).toEqual(
              original[i][key],
            );
          for (const key of ["x", "y", "width", "height"] as const)
            expect(
              Math.abs(exported[i][key] - original[i][key]),
              `${i} ${original[i].tag} ${key}`,
            ).toBeLessThanOrEqual(1);
        }
        // Measure both print trees at the A4 content width (210 mm minus 17 mm margins).
        await page.setViewportSize({ width: 665, height: 1123 });
        await reader.setViewportSize({ width: 665, height: 1123 });
        await reader.emulateMedia({ media: "print" });
        await page.emulateMedia({ media: "print" });
        const printOriginal = await visual(page),
          printExported = await visual(reader);
        for (let i = 0; i < printOriginal.length; i++) {
          for (const key of ["fontSize", "background"] as const)
            expect(printExported[i][key], `print ${i} ${key}`).toEqual(
              printOriginal[i][key],
            );
          for (const key of ["x", "y", "width", "height"] as const)
            expect(
              Math.abs(printExported[i][key] - printOriginal[i][key]),
              `print ${i} ${key}`,
            ).toBeLessThanOrEqual(1);
        }
        await page.emulateMedia({ media: "screen" });
        await reader.emulateMedia({ media: "screen" });
        await page.setViewportSize({ width: 1440, height: 1000 });
        await reader.setViewportSize({ width: 1440, height: 1000 });
        await reader.screenshot({
          path: path.join(output, `${template}-${locale}-desktop.png`),
          fullPage: true,
        });
        await reader.emulateMedia({ media: null });
        const pdf = await reader.pdf({
          path: path.join(output, `${template}-${locale}.pdf`),
          preferCSSPageSize: true,
          printBackground: true,
        });
        const mediaBox =
          /\/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)\s*\]/.exec(
            pdf.toString("latin1"),
          );
        expect(
          mediaBox,
          "Standalone HTML must retain the template's A4 @page rule",
        ).not.toBeNull();
        expect(Number(mediaBox![1])).toBeCloseTo(595, 0);
        expect(Number(mediaBox![2])).toBeCloseTo(842, 0);
        await reader.setViewportSize({ width: 360, height: 800 });
        await page.setViewportSize({ width: 360, height: 800 });
        const mobileOriginal = await visual(page),
          mobileExported = await visual(reader);
        for (let i = 0; i < mobileOriginal.length; i++)
          for (const key of ["x", "y", "width", "height"] as const)
            expect(
              Math.abs(mobileExported[i][key] - mobileOriginal[i][key]),
              `mobile ${i} ${key}`,
            ).toBeLessThanOrEqual(1);
        expect(
          await reader.evaluate(
            () => document.documentElement.scrollWidth - innerWidth,
          ),
        ).toBeLessThanOrEqual(1);
        await reader.screenshot({
          path: path.join(output, `${template}-${locale}-mobile.png`),
          fullPage: true,
        });
        expect(requests).toEqual([]);
      } finally {
        await offline.close();
      }
    });
  }
}

test("save dialog supports keyboard dismissal, restores focus and prints without the dialog", async ({
  page,
}) => {
  await page.goto("/preview?template=resume");
  const trigger = page.getByRole("button", { name: "저장·공유" });
  await trigger.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.evaluate(() => {
    window.print = () => {
      document.documentElement.dataset.modalDuringPrint = String(
        Boolean(document.querySelector("dialog[open]")),
      );
      window.dispatchEvent(new Event("afterprint"));
    };
  });
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "PDF로 저장" })
    .click();
  await expect(page.locator("html")).toHaveAttribute(
    "data-modal-during-print",
    "false",
  );
  await expect(page.getByRole("dialog")).not.toBeVisible();
  for (const locale of ["ko", "en"]) {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto(`${locale === "ko" ? "" : "/en"}/preview?template=resume`);
    await page
      .getByRole("button", {
        name: locale === "ko" ? "저장·공유" : "Save & share",
      })
      .click();
    const modal = page.getByRole("dialog");
    expect(
      await modal.evaluate((el) => el.scrollWidth - el.clientWidth),
    ).toBeLessThanOrEqual(1);
    await modal.screenshot({
      path: path.join(output, `dialog-${locale}-mobile.png`),
    });
  }
});

test("example links retain locale and template, with a selectable clipboard fallback", async ({
  page,
}) => {
  await page.goto("/en/preview?template=insight");
  await page.evaluate(() =>
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (value: string) => {
          document.documentElement.dataset.copied = value;
        },
      },
    }),
  );
  await page.getByRole("button", { name: "Save & share" }).click();
  await page.getByRole("button", { name: "Copy example link" }).click();
  await expect(page.getByRole("status")).toHaveText("Link copied.");
  expect(
    new URL((await page.locator("html").getAttribute("data-copied"))!).pathname,
  ).toBe("/en/preview");
  expect(
    new URL((await page.locator("html").getAttribute("data-copied"))!).search,
  ).toBe("?template=insight");
  await page.evaluate(() =>
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async () => {
          throw new Error("Permission denied");
        },
      },
    }),
  );
  await page.getByRole("button", { name: "Copy example link" }).click();
  const input = page.getByRole("textbox", { name: "Link to share" });
  await expect(input).toBeFocused();
  expect(
    await input.evaluate(
      (el: HTMLInputElement) => el.selectionEnd! - el.selectionStart!,
    ),
  ).toBe((await input.inputValue()).length);
  await expect(
    page.getByRole("button", { name: "Copy public document link" }),
  ).toHaveCount(0);
});

test("HTML failure can be retried and a missing photo is explained", async ({
  page,
}) => {
  await page.goto("/preview?template=resume");
  await page.route("**/fonts/OFL.txt", (route) =>
    route.fulfill({ status: 503, body: "Unavailable" }),
  );
  await page.getByRole("button", { name: "저장·공유" }).click();
  await page.getByRole("button", { name: "HTML로 저장" }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "다시 시도",
  );
  await expect(page.getByRole("button", { name: "HTML로 저장" })).toBeEnabled();
  await page.unroute("**/fonts/OFL.txt");
  await page.locator("[data-document]").evaluate((root) => {
    root.querySelectorAll("img").forEach((image) => image.remove());
    const image = document.createElement("img");
    image.src = `${location.origin}/missing-photo.png`;
    root.prepend(image);
  });
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "HTML로 저장" }).click(),
  ]);
  expect(await download.failure()).toBeNull();
  await expect(page.getByRole("status")).toContainText(
    "프로필 이미지를 불러오지 못해",
  );
});

test("document outline navigates to the heading and closes, while private results offer no public link", async ({
  page,
}) => {
  await page.goto("/preview?template=profile");
  await page.locator(".document-outline summary").click();
  const link = page
    .getByRole("navigation", { name: "문서 목차" })
    .getByRole("link")
    .last();
  const id = await link.getAttribute("href");
  await link.click();
  await expect(page.locator(id!)).toBeFocused();
  await expect(page.locator(".document-outline")).not.toHaveAttribute("open");
  expect(
    await page.locator(id!).evaluate((el) => el.getBoundingClientRect().top),
  ).toBeGreaterThanOrEqual(150);
  await page.goto("/result?template=profile");
  await expect(page.getByRole("button", { name: "저장·공유" })).toBeDisabled();
  await expect(page.getByRole("button", { name: /링크 복사/ })).toHaveCount(0);
});
