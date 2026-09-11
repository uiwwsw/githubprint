import test from "node:test";
import assert from "node:assert/strict";
import { getSiteUrl, DEFAULT_SITE_URL } from "../lib/site-url";
import {
  buildHomeMetadata,
  buildHomeStructuredData,
  buildTemplateMetadata,
  buildTemplateStructuredData,
  buildShowcaseMetadata,
  buildShowcaseStructuredData,
  serializeStructuredData,
} from "../lib/seo";
import { TEMPLATE_IDS } from "../lib/template-guides";
import sitemap from "../app/sitemap";

test("production canonicals never use a unique Vercel deployment domain", () => {
  assert.equal(
    getSiteUrl({
      NODE_ENV: "production",
      VERCEL_URL: "preview-123.vercel.app",
    }),
    DEFAULT_SITE_URL,
  );
  assert.equal(
    getSiteUrl({
      NEXT_PUBLIC_SITE_URL:
        " https://portfolio.example/path?tracking=1#fragment ",
    }),
    "https://portfolio.example",
  );
  assert.equal(
    getSiteUrl({ NODE_ENV: "development" }),
    "http://localhost:3000",
  );
  assert.throws(() =>
    getSiteUrl({ NEXT_PUBLIC_SITE_URL: "javascript:alert(1)" }),
  );
  assert.throws(() =>
    getSiteUrl({ NEXT_PUBLIC_SITE_URL: "https://user:password@example.com" }),
  );
});

test("public metadata has reciprocal language alternatives and a real share image", () => {
  for (const locale of ["ko", "en"] as const) {
    const home = buildHomeMetadata(locale);
    assert.match(home.description ?? "", /Word/);
    for (const metadata of [
      home,
      ...TEMPLATE_IDS.map((id) => buildTemplateMetadata(locale, id)),
    ]) {
      assert.ok(metadata.alternates?.canonical);
      const languages = metadata.alternates?.languages;
      assert.deepEqual(languages?.ko, languages?.["x-default"]);
      assert.ok(languages?.en);
      const serialized = JSON.stringify(metadata);
      assert.match(serialized, /summary_large_image/);
      assert.match(serialized, new RegExp(`/share/${locale}/`));
      assert.doesNotMatch(serialized, /"noindex"|"index":false/);
    }
  }
});

test("structured data cannot close the script element and retains its content", () => {
  const data = {
    name: '</script><script>alert("x")</script>',
    text: "안녕하세요 & < >",
  };
  const output = serializeStructuredData(data);
  assert.ok(!output.includes("<"));
  assert.deepEqual(JSON.parse(output), data);
});

test("structured data describes available features and canonical breadcrumbs", () => {
  for (const locale of ["ko", "en"] as const) {
    const home = buildHomeStructuredData(locale);
    assert.ok(home.some((node) => node["@type"] === "WebSite"));
    assert.ok(home.some((node) => node["@type"] === "WebPage"));
    assert.ok(home.some((node) => node["@type"] === "WebApplication"));
    assert.doesNotMatch(
      JSON.stringify(home),
      /aggregateRating|reviewCount|ATS-friendly/,
    );
    for (const id of TEMPLATE_IDS) {
      const data = buildTemplateStructuredData(locale, id);
      const breadcrumbs = data.find(
        (node) => node["@type"] === "BreadcrumbList",
      );
      assert.equal(breadcrumbs?.itemListElement?.length, 2);
      assert.match(
        breadcrumbs?.itemListElement?.[1].item ?? "",
        new RegExp(`/templates/${id}$`),
      );
    }
  }
});

test("an unavailable public resume does not publish an indexable fabricated profile", () => {
  assert.deepEqual(buildShowcaseStructuredData("ko", "uiwwsw", null), []);
  assert.match(
    JSON.stringify(buildShowcaseMetadata("ko", "uiwwsw", null).robots),
    /"index":false/,
  );
});

test("sitemap includes canonical public pages with truthful stable dates", () => {
  const entries = sitemap();
  assert.equal(entries.length, 12);
  assert.equal(new Set(entries.map((entry) => entry.url)).size, 12);
  assert.deepEqual(entries, sitemap());
  for (const entry of entries) {
    assert.doesNotMatch(entry.url, /result|preview|api|\?/);
    assert.ok(entry.alternates?.languages?.["x-default"]);
    if (entry.url.endsWith("showcase"))
      assert.equal(entry.lastModified, undefined);
    else assert.equal(entry.lastModified, "2026-09-11");
  }
});
