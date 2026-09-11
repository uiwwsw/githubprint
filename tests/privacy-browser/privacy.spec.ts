import { test, expect, type BrowserContext, type Page } from "@playwright/test";
import { createCipheriv, createHash, randomBytes } from "node:crypto";
import { mkdir, readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";
import JSZip from "jszip";
import { getDictionary } from "../../lib/i18n";

const output = path.resolve(".cache/privacy-qa");
async function signIn(context: BrowserContext, scopes = ["read:user", "repo"]) {
  const iv = randomBytes(12);
  const cipher = createCipheriv(
    "aes-256-gcm",
    createHash("sha256")
      .update("synthetic-session-secret-only-for-tests")
      .digest(),
    iv,
  );
  const value = {
    accessToken: "synthetic-test-token",
    createdAt: new Date().toISOString(),
    scopes,
    user: {
      login: "privacy-fixture",
      name: "Privacy Fixture",
      email: null,
      avatarUrl: "https://avatars.githubusercontent.com/u/1",
      profileUrl: "https://github.com/privacy-fixture",
    },
  };
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(value)),
    cipher.final(),
  ]);
  await context.addCookies([
    {
      name: "githubprint-github-session",
      value: [iv, cipher.getAuthTag(), encrypted]
        .map((part) => part.toString("base64url"))
        .join("."),
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
  await context.route("https://avatars.githubusercontent.com/**", (route) =>
    route.fulfill({ path: path.resolve("public/apple-touch-icon.png") }),
  );
}

async function checkExports(
  page: Page,
  locale: "ko" | "en",
  filename: string,
  privateDetails: boolean,
  resume = false,
) {
  await mkdir(output, { recursive: true });
  await page.evaluate(() => document.fonts.ready);
  const preview = await page.locator("[data-document]").innerText();
  expect(preview).not.toContain("UNSELECTED_SENTINEL");
  if (privateDetails) expect(preview).toContain("PRIVATE_DESCRIPTION_SENTINEL");
  else expect(preview).not.toContain("PRIVATE_DESCRIPTION_SENTINEL");
  if (!resume && !privateDetails)
    expect(preview).not.toContain("private-atlas");
  if (resume) expect(preview).toContain("AUTHORED_SENTINEL");
  const dict = getDictionary(locale);
  await page.getByRole("button", { name: dict.studio.saveShare }).click();
  for (const format of ["word", "html"] as const) {
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page
        .getByRole("button", {
          name:
            format === "word"
              ? locale === "ko"
                ? "Word로 저장"
                : "Save Word"
              : locale === "ko"
                ? "HTML로 저장"
                : "Save HTML",
        })
        .click(),
    ]);
    const file = path.join(
      output,
      `${filename}.${format === "word" ? "docx" : "html"}`,
    );
    await download.saveAs(file);
    const buffer = await readFile(file);
    const data =
      format === "html"
        ? buffer.toString()
        : await (await JSZip.loadAsync(buffer))
            .file("word/document.xml")!
            .async("string");
    expect(data).not.toContain("UNSELECTED_SENTINEL");
    expect(data).not.toContain("synthetic-test-token");
    if (privateDetails) expect(data).toContain("PRIVATE_DESCRIPTION_SENTINEL");
    else expect(data).not.toContain("PRIVATE_DESCRIPTION_SENTINEL");
    if (!resume && !privateDetails) expect(data).not.toContain("private-atlas");
    if (resume) expect(data).toContain("AUTHORED_SENTINEL");
  }
  await page
    .getByRole("button", {
      name: locale === "ko" ? "닫기" : "Close",
      exact: true,
    })
    .click();
  const pdfPath = path.join(output, `${filename}.pdf`);
  await page.pdf({
    path: pdfPath,
    preferCSSPageSize: true,
    printBackground: true,
    tagged: true,
  });
  if (process.env.PDFTOTEXT_PATH) {
    const pdfText = execFileSync(process.env.PDFTOTEXT_PATH, [pdfPath, "-"], {
      encoding: "utf8",
    });
    expect(pdfText).not.toContain("UNSELECTED_SENTINEL");
    if (privateDetails)
      expect(pdfText).toContain("PRIVATE_DESCRIPTION_SENTINEL");
    else expect(pdfText).not.toContain("PRIVATE_DESCRIPTION_SENTINEL");
    if (resume) expect(pdfText).toContain("AUTHORED_SENTINEL");
  }
  await page.screenshot({
    path: path.join(output, `${filename}.png`),
    fullPage: true,
  });
}

for (const locale of ["ko", "en"] as const) {
  test(`${locale}: ordinary login and switching templates keep private access optional`, async ({
    page,
    context,
  }) => {
    await signIn(context, ["read:user", "public_repo"]);
    const pickerRequests: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/api/github/private-repos"))
        pickerRequests.push(request.url());
    });
    await page.goto(locale === "en" ? "/en" : "/");
    const generator = page.locator("#generator");
    await expect(generator).toBeVisible();
    await generator.getByRole("button", { name: /^Profile/ }).click();
    await expect(
      generator.locator('input[name="analysis-scope"]').first(),
    ).toBeChecked();
    await generator.locator('input[name="analysis-scope"]').nth(1).check();
    await expect(
      generator.getByRole("link", { name: /GitHub/ }),
    ).toHaveAttribute("href", /access=private/);
    await expect(
      generator.getByRole("button", {
        name: getDictionary(locale).home.submit,
      }),
    ).toBeDisabled();
    await generator.getByRole("button", { name: /^Resume/ }).click();
    await expect(
      generator.getByRole("button", {
        name: getDictionary(locale).home.submit,
      }),
    ).toBeEnabled();
    await expect(
      generator.locator('input[name="resume-source"]').first(),
    ).toBeChecked();
    await page.setViewportSize({ width: 390, height: 844 });
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      )
      .toBe(true);
    await mkdir(output, { recursive: true });
    await generator.screenshot({
      path: path.join(output, `generator-${locale}-mobile.png`),
    });
    expect(pickerRequests).toEqual([]);
  });

  for (const variant of [
    "brief-summary",
    "profile-details",
    "insight-summary",
    "resume-source",
    "resume-enriched",
  ] as const) {
    test(`${locale} ${variant}: scope survives preview and all file exports`, async ({
      page,
      context,
    }) => {
      await signIn(context);
      await mkdir(output, { recursive: true });
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(locale === "en" ? "/en" : "/");
      const generator = page.locator("#generator");
      const template = variant.split("-")[0];
      const resume = template === "resume";
      await generator
        .getByRole("button", {
          name: new RegExp(`^${template[0].toUpperCase()}${template.slice(1)}`),
        })
        .click();
      if (resume) {
        await generator.locator('input[name="resume-source"]').nth(1).check();
        if (variant === "resume-enriched")
          await generator.getByRole("checkbox").check();
      } else {
        await generator
          .locator('input[name="analysis-scope"]')
          .nth(variant.endsWith("details") ? 2 : 1)
          .check();
        await generator
          .getByRole("checkbox", { name: "private-atlas", exact: true })
          .check();
      }
      await generator.screenshot({
        path: path.join(output, `generator-${locale}-${variant}.png`),
      });
      await generator
        .getByRole("button", { name: getDictionary(locale).home.submit })
        .click();
      await expect(page.locator("[data-document]")).toBeVisible();
      expect(page.url()).toContain("config=");
      expect(page.url()).not.toContain("private-atlas");
      if (resume)
        await expect(
          page.locator("[data-document] img").first(),
        ).toHaveJSProperty("naturalWidth", 1);
      await checkExports(
        page,
        locale,
        `${locale}-${variant}`,
        variant === "profile-details" || variant === "resume-enriched",
        resume,
      );
      expect(errors).toEqual([]);
    });
  }

  test(`${locale}: legacy private links require source selection instead of reading private data`, async ({
    page,
    context,
  }) => {
    await signIn(context);
    await page.goto(`${locale === "en" ? "/en" : ""}/result/profile?private=1`);
    await expect(
      page.getByRole("button", {
        name: getDictionary(locale).studio.saveShare,
      }),
    ).toBeDisabled();
    await expect(
      page.getByText(
        locale === "ko"
          ? "자료 범위를 다시 선택해 주세요"
          : "Choose your sources again",
        { exact: true },
      ),
    ).toBeVisible();
  });
}
