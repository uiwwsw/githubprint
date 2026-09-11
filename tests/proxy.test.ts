import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import * as proxyModule from "../proxy";

type ProxyModuleShape = {
  default?: {
    proxy: (request: NextRequest) => Response;
  };
  proxy?: (request: NextRequest) => Response;
};

const proxy =
  (proxyModule as ProxyModuleShape).proxy ??
  (proxyModule as ProxyModuleShape).default?.proxy;

if (!proxy) {
  throw new Error("Failed to load proxy entrypoint for tests.");
}

test("does not redirect API requests that carry a lang query", () => {
  const response = proxy(
    new NextRequest("https://example.com/api/resume-docx?lang=ko"),
  );

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("location"), null);
});

test("still redirects localized page requests that carry a lang query", () => {
  const response = proxy(new NextRequest("https://example.com/result?lang=en"));

  assert.equal(response.status, 308);
  assert.equal(
    response.headers.get("location"),
    "https://example.com/en/result",
  );
});

test("language redirects preserve the exact page and non-language query parameters", () => {
  const response = proxy(
    new NextRequest(
      "https://example.com/en/templates/resume?lang=ko&utm_source=test",
    ),
  );
  assert.equal(response.status, 308);
  assert.equal(
    response.headers.get("location"),
    "https://example.com/templates/resume?utm_source=test",
  );
});

test("language redirects preserve result template paths", () => {
  const response = proxy(
    new NextRequest("https://example.com/result/profile?lang=en"),
  );
  assert.equal(
    response.headers.get("location"),
    "https://example.com/en/result/profile",
  );
});

test("private results and fictional previews carry noindex response headers", () => {
  for (const path of [
    "/result/profile",
    "/en/result/resume",
    "/preview",
    "/en/preview",
  ]) {
    const response = proxy(new NextRequest(`https://example.com${path}`));
    assert.match(response.headers.get("X-Robots-Tag") ?? "", /noindex/);
  }
  assert.equal(
    proxy(new NextRequest("https://example.com/templates/resume")).headers.get(
      "X-Robots-Tag",
    ),
    null,
  );
});
