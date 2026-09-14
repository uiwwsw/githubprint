const { spawnSync } = require("node:child_process");
const path = require("node:path");

const project = path.resolve(
  __dirname,
  "../tests/docx-validator/DocxValidator.csproj",
);
const files = process.argv.slice(2);
const result = spawnSync(
  process.env.DOCX_DOTNET_PATH || "dotnet",
  [
    "run",
    "--project",
    project,
    "--",
    ...(files.length
      ? files
      : [path.resolve(__dirname, "../.cache/document-qa")]),
  ],
  {
    stdio: "inherit",
    env: { ...process.env, DOTNET_CLI_TELEMETRY_OPTOUT: "1" },
  },
);
if (result.error)
  console.error(
    "DOCX validation requires the .NET 8 SDK or newer. Set DOCX_DOTNET_PATH to its dotnet executable.",
  );
process.exitCode = result.status ?? 1;
