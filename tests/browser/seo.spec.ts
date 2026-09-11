import { test, expect } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const origin =
  process.env.SEO_CANONICAL_ORIGIN ?? "https://githubprint.vercel.app";
const artifacts = path.join(process.cwd(), ".cache/seo-qa");
const templates = ["brief", "profile", "insight", "resume"];

test.describe("Search crawler HTML", () => {
  test.use({ javaScriptEnabled: false, userAgent: "facebookexternalhit/1.1" });
  for (const locale of ["ko", "en"]) {
    for (const template of ["home", ...templates]) {
      test(`${locale} ${template} serves complete localized SEO without JavaScript`, async ({
        page,
      }) => {
        const prefix = locale === "en" ? "/en" : "";
        const route =
          template === "home"
            ? prefix || "/"
            : `${prefix}/templates/${template}`;
        const response = await page.goto(route);
        expect(response?.status()).toBe(200);
        await expect(page.locator("html")).toHaveAttribute("lang", locale);
        await expect(page.locator("h1")).toHaveCount(1);
        await expect(
          page.locator('head link[rel="canonical"]'),
        ).toHaveAttribute("href", `${origin}${route === "/" ? "" : route}`);
        const koPath = template === "home" ? "/" : `/templates/${template}`;
        await expect(page.locator('head link[hreflang="ko"]')).toHaveAttribute(
          "href",
          `${origin}${koPath === "/" ? "" : koPath}`,
        );
        await expect(page.locator('head link[hreflang="en"]')).toHaveAttribute(
          "href",
          `${origin}/en${koPath === "/" ? "" : koPath}`,
        );
        await expect(
          page.locator('head link[hreflang="x-default"]'),
        ).toHaveAttribute("href", `${origin}${koPath === "/" ? "" : koPath}`);
        await expect(
          page.locator('head meta[name="description"]'),
        ).toHaveAttribute("content", /Word/);
        await expect(
          page.locator('head meta[property="og:image"]'),
        ).toHaveAttribute(
          "content",
          `${origin}/share/${locale}/${template}.png`,
        );
        await expect(
          page.locator('head meta[name="twitter:card"]'),
        ).toHaveAttribute("content", "summary_large_image");
        expect(
          await page.locator('meta[name="robots"]').getAttribute("content"),
        ).not.toContain("noindex");
        const structured = (
          await page
            .locator('script[type="application/ld+json"]')
            .allTextContents()
        ).map((json) => JSON.parse(json));
        expect(structured.some((node) => node["@type"] === "WebPage")).toBe(
          true,
        );
        if (template === "home") {
          for (const id of templates)
            await expect(
              page.locator(`a[href="${prefix}/templates/${id}"]`),
            ).toHaveCount(1);
          await expect(page.locator(".faq-list details")).toHaveCount(5);
        } else {
          expect(
            structured.some((node) => node["@type"] === "BreadcrumbList"),
          ).toBe(true);
          expect(
            (await page.locator(".guide-content").innerText()).length,
          ).toBeGreaterThan(500);
          await expect(
            page.locator(`a[href="${prefix}/preview?template=${template}"]`),
          ).toHaveCount(2);
        }
      });
    }
  }
});

test("sitemap, robots, redirects, and private headers agree", async ({
  request,
}) => {
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  const xml = await sitemap.text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    (match) => match[1],
  );
  expect(urls).toHaveLength(12);
  expect(new Set(urls).size).toBe(12);
  expect(urls.every((url) => url.startsWith(`${origin}/`))).toBe(true);
  expect(urls.some((url) => /result|preview|api/.test(url))).toBe(false);
  expect(xml).toContain('hreflang="x-default"');
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain(`Sitemap: ${origin}/sitemap.xml`);
  expect(robots).not.toMatch(/Disallow: \/(?:result|preview|en|_next|share)/);
  expect(robots).not.toContain("Disallow: /api/\n");
  const redirect = await request.get(
    "/en/templates/resume?lang=ko&utm_source=test",
    { maxRedirects: 0 },
  );
  expect(redirect.status()).toBe(308);
  const location = new URL(redirect.headers().location, redirect.url());
  expect(location.pathname).toBe("/templates/resume");
  expect(location.search).toBe("?utm_source=test");
  for (const route of [
    "/preview",
    "/en/preview",
    "/result/profile",
    "/en/result/resume",
    "/api/resume-docx",
  ]) {
    const response = await request.get(route, { maxRedirects: 0 });
    expect(response.headers()["x-robots-tag"], route).toContain("noindex");
  }
  expect((await request.get("/templates/not-a-template")).status()).toBe(404);
});

test("all localized share images are publicly readable 1200×630 PNGs", async ({
  request,
}) => {
  await mkdir(artifacts, { recursive: true });
  for (const locale of ["ko", "en"]) {
    for (const kind of ["home", ...templates]) {
      const response = await request.get(`/share/${locale}/${kind}.png`);
      expect(response.status()).toBe(200);
      expect(response.headers()["content-type"]).toContain("image/png");
      const png = await response.body();
      expect(png.subarray(1, 4).toString()).toBe("PNG");
      expect(png.readUInt32BE(16)).toBe(1200);
      expect(png.readUInt32BE(20)).toBe(630);
      await writeFile(path.join(artifacts, `share-${locale}-${kind}.png`), png);
    }
  }
  expect((await request.get("/share/ko/invalid.png")).status()).toBe(404);
});

test("guide navigation and content fit mobile and desktop viewports", async ({
  page,
}) => {
  await mkdir(artifacts, { recursive: true });
  for (const locale of ["ko", "en"]) {
    for (const width of [360, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(`${locale === "en" ? "/en" : ""}/templates/resume`);
      await page.evaluate(() => document.fonts.ready);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth - innerWidth,
        ),
      ).toBeLessThanOrEqual(1);
      await page.screenshot({
        path: path.join(artifacts, `guide-${locale}-${width}.png`),
        fullPage: true,
      });
    }
  }
});
