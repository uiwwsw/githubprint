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
  const response = proxy(
    new NextRequest("https://example.com/result?lang=en"),
  );

  assert.equal(response.status, 307);
  assert.equal(response.headers.get("location"), "https://example.com/result");
});
