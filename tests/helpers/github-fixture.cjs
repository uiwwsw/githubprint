// Synthetic GitHub only. This interceptor is injected by tests, never imported by the application.
const username = "privacy-fixture";
const calls = [];
let privateSource = true;
const publicRepo = repo("public-project", false, "Public project description");
const secretRepo = repo(
  "private-atlas",
  true,
  "PRIVATE_DESCRIPTION_SENTINEL internal dashboard",
);
const unrelatedRepo = repo("unselected-vault", true, "UNSELECTED_SENTINEL");
function repo(name, isPrivate, description) {
  return {
    name,
    private: isPrivate,
    description,
    archived: false,
    created_at: "2025-01-01T00:00:00Z",
    default_branch: "main",
    fork: false,
    forks_count: 0,
    homepage: "",
    html_url: `https://github.com/${username}/${name}`,
    id: name.length,
    language: "TypeScript",
    open_issues_count: 0,
    pushed_at: "2026-09-01T00:00:00Z",
    size: 200,
    stargazers_count: isPrivate ? 0 : 20,
    topics: isPrivate ? ["TOPIC_SECRET_SENTINEL", "react"] : ["typescript"],
    updated_at: "2026-09-01T00:00:00Z",
  };
}
function manifest(en) {
  return `basics:\n  name: "Privacy Fixture"\n  headline: "${en ? "Software engineer" : "소프트웨어 엔지니어"}"\n  email: "authored@example.test"\n  avatar: "assets/avatar.png"\nsummary:\n  markdown: "content/summary.md"\nprojects:\n  - title: "Authored project"\n    repo: "private-atlas"\n    bullets: ["AUTHORED_SENTINEL"]\n  - title: "Another owner"\n    repo: "other/private-atlas"\nfeaturedProjects:\n  - project: "private-atlas"\n  - project: "other/private-atlas"\nskills:\n  - title: "Core"\n    items: ["TypeScript"]\n`;
}
const realFetch = globalThis.fetch;
async function mockFetch(input, init = {}) {
  const url = new URL(
    typeof input === "string" || input instanceof URL
      ? input.toString()
      : input.url,
  );
  if (url.hostname !== "api.github.com") {
    if (url.hostname === "api.openai.com")
      throw new Error("Private data reached external AI");
    return realFetch(input, init);
  }
  const route = url.pathname;
  calls.push({
    path: route,
    query: url.search,
    body: init.body,
    cache: init.cache,
    method: init.method ?? "GET",
  });
  const json = (body, status = 200) => Response.json(body, { status });
  const file = (text) =>
    json({ content: Buffer.from(text).toString("base64"), encoding: "base64" });
  if (route === "/graphql")
    return json({
      data: {
        user: {
          pinnedItems: {
            nodes: [
              {
                name: "unselected-vault",
                isPrivate: true,
                description: "UNSELECTED_SENTINEL",
                homepageUrl: "",
                stargazerCount: 0,
                updatedAt: unrelatedRepo.updated_at,
                url: unrelatedRepo.html_url,
                repositoryTopics: { nodes: [] },
              },
            ],
          },
        },
      },
    });
  if (route === `/users/${username}`)
    return json({
      avatar_url: "https://avatars.githubusercontent.com/u/1",
      bio: "Public engineer bio",
      blog: "",
      company: null,
      created_at: publicRepo.created_at,
      email: null,
      followers: 10,
      following: 3,
      html_url: `https://github.com/${username}`,
      location: "Seoul",
      login: username,
      name: "Privacy Fixture",
      public_repos: 1,
      type: "User",
      updated_at: publicRepo.updated_at,
    });
  if (route === `/users/${username}/repos`)
    return json([
      publicRepo,
      ...(privateSource ? [] : [repo("resume", false, "Resume source")]),
    ]);
  if (route === "/user/repos")
    return json([
      secretRepo,
      unrelatedRepo,
      ...(privateSource ? [repo("resume", true, "Resume source")] : []),
    ]);
  if (route === "/user") throw new Error("Implicit private profile read");
  const match = route.match(/^\/repos\/privacy-fixture\/([^/]+)(.*)$/);
  if (!match) return json({ message: "Not Found" }, 404);
  const [, name, suffix] = match;
  if (name === unrelatedRepo.name)
    throw new Error("Read of unselected private repository");
  if (!suffix)
    return name === "resume"
      ? json(repo("resume", privateSource, "Resume source"))
      : name === secretRepo.name
        ? json(secretRepo)
        : name === publicRepo.name
          ? json(publicRepo)
          : json({ message: "Not Found" }, 404);
  if (name === "resume") {
    if (suffix === "/contents")
      return json(
        ["resume.yaml", "resume.en.yaml", "content", "assets"].map((name) => ({
          name,
          type: name.endsWith("yaml") ? "file" : "dir",
        })),
      );
    if (
      suffix === "/contents/resume.yaml" ||
      suffix === "/contents/resume.en.yaml"
    )
      return file(manifest(suffix.includes(".en.")));
    if (suffix === "/contents/content/summary.md")
      return file("Authored resume summary. AUTHORED_SUMMARY_SENTINEL");
    if (suffix === "/contents/assets/avatar.png")
      return json({
        content:
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j5D8AAAAASUVORK5CYII=",
        encoding: "base64",
      });
  }
  if (suffix === "/readme")
    return file(
      name === secretRepo.name
        ? "# PRIVATE_README_SENTINEL\nReact and TypeScript application with documented setup and tests."
        : "# Public project\nA TypeScript project with installation instructions and tests.",
    );
  if (suffix === "/contents")
    return json(
      ["README.md", "package.json", "tests", ".github"].map((name) => ({
        name,
        type: name.includes(".") ? "file" : "dir",
      })),
    );
  if (suffix === "/contents/package.json")
    return file(
      JSON.stringify({
        name: name === secretRepo.name ? "MANIFEST_SECRET_SENTINEL" : name,
        dependencies: { react: "19.0.0" },
        scripts: { test: "vitest" },
      }),
    );
  if (suffix === "/commits")
    return json([
      {
        commit: {
          message:
            name === secretRepo.name ? "COMMIT_SECRET_SENTINEL" : "Add tests",
        },
      },
    ]);
  return json({ message: "Not Found" }, 404);
}
module.exports = {
  username,
  calls,
  mockFetch,
  repo,
  setPrivateSource(value) {
    privateSource = value;
  },
  reset() {
    calls.length = 0;
    privateSource = true;
  },
};
if (process.env.GITHUBPRINT_PRIVACY_TEST_SERVER === "1") {
  process.env.GITHUB_CLIENT_ID = "synthetic-test-client";
  process.env.GITHUB_CLIENT_SECRET = "synthetic-test-secret";
  process.env.GITHUB_SESSION_SECRET = "synthetic-session-secret-only-for-tests";
  process.env.GITHUB_TOKEN = "";
  process.env.OPENAI_API_KEY = "";
  process.env.GITHUBPRINT_USE_FIXTURE = "0";
  process.env.GITFOLIO_USE_FIXTURE = "0";
  globalThis.fetch = mockFetch;
}
