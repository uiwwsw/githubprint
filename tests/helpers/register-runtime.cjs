// Execute server modules in isolated Node tests, without a Next request runtime.
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");
const root = path.resolve(__dirname, "../..");
const resolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...args) {
  if (request === "server-only")
    request = path.join(root, "scripts/shims/server-only.cjs");
  if (request.startsWith("@/")) request = path.join(root, request.slice(2));
  return resolve.call(this, request, ...args);
};
for (const extension of [".ts", ".tsx"]) {
  require.extensions[extension] = (module, filename) => {
    const { outputText } = ts.transpileModule(
      fs.readFileSync(filename, "utf8"),
      {
        fileName: filename,
        compilerOptions: {
          esModuleInterop: true,
          jsx: ts.JsxEmit.ReactJSX,
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2022,
        },
      },
    );
    module._compile(outputText, filename);
  };
}
