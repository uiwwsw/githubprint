#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const Module = require("module");
const ts = require("typescript");

const projectRoot = path.resolve(__dirname, "..");
const shimPath = path.join(__dirname, "shims", "server-only.cjs");
const reportDir = path.join(projectRoot, ".cache", "gitfolio", "reports");
const reportPath = path.join(reportDir, "regression-summary.json");
const markdownPath = path.join(reportDir, "regression-summary.md");
const originalResolveFilename = Module._resolveFilename;

function registerRuntime() {
  Module._resolveFilename = function patchedResolveFilename(
    request,
    parent,
    isMain,
    options,
  ) {
    if (request === "server-only") {
      return shimPath;
    }

    if (request.startsWith("@/")) {
      const absoluteRequest = path.join(projectRoot, request.slice(2));
      return originalResolveFilename.call(
        this,
        absoluteRequest,
        parent,
        isMain,
        options,
      );
    }

    return originalResolveFilename.call(this, request, parent, isMain, options);
  };

  const compilerOptions = {
    esModuleInterop: true,
    jsx: ts.JsxEmit.ReactJSX,
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  };

  const compile = (module, filename) => {
    const source = fs.readFileSync(filename, "utf8");
    const { outputText } = ts.transpileModule(source, {
      compilerOptions,
      fileName: filename,
    });
    module._compile(outputText, filename);
  };

  require.extensions[".ts"] = compile;
  require.extensions[".tsx"] = compile;
}

function assertCondition(condition, message, failures) {
  if (!condition) {
    failures.push(message);
  }
}

function summarizeTopWorkingStyles(scoring) {
  return scoring.workingStyles.slice(0, 3).map((item) => ({
    id: item.id,
    score: item.score,
  }));
}

function writeReports(results) {
  fs.mkdirSync(reportDir, { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));

  const lines = [
    "# GitFolio Regression Summary",
    "",
    `Generated at: ${new Date().toISOString()}`,
    "",
    "| Case | Orientation | Score | Cohort | Confidence | Top working styles | Result |",
    "| --- | --- | ---: | --- | ---: | --- | --- |",
  ];

  results.forEach((result) => {
    const styles = result.topWorkingStyles
      .map((item) => `${item.id} (${item.score})`)
      .join(", ");
    lines.push(
      `| ${result.id} | ${result.primaryOrientation ?? "-"} | ${result.primaryOrientationScore} | ${result.cohortId} | ${result.confidence} | ${styles} | ${result.ok ? "pass" : "fail"} |`,
    );
  });

  fs.writeFileSync(markdownPath, `${lines.join("\n")}\n`);
}

function main() {
  registerRuntime();

  const { profileEngineConfig } = require("../lib/data-loader.ts");
  const { buildBenchmarkSnapshot } = require("../lib/benchmark.ts");
  const { regressionCases } = require("../fixtures/regression-cases.ts");
  const { buildRuleBasedAnalysis } = require("../lib/narrative-writer.ts");
  const { extractProfileFeatures } = require("../lib/profile-features.ts");
  const { scoreProfile } = require("../lib/rule-engine.ts");

  const results = regressionCases.map((testCase) => {
    const featureSet = extractProfileFeatures(testCase.source, profileEngineConfig);
    const scoringKo = scoreProfile(
      testCase.source,
      featureSet,
      profileEngineConfig,
      "ko",
    );
    const scoringEn = scoreProfile(
      testCase.source,
      featureSet,
      profileEngineConfig,
      "en",
    );
    const benchmarkKo = buildBenchmarkSnapshot(testCase.source, scoringKo, "ko");
    const benchmarkEn = buildBenchmarkSnapshot(testCase.source, scoringEn, "en");
    const analysisKo = buildRuleBasedAnalysis(
      testCase.source,
      scoringKo,
      profileEngineConfig,
      "ko",
    );
    const analysisEn = buildRuleBasedAnalysis(
      testCase.source,
      scoringEn,
      profileEngineConfig,
      "en",
    );
    const failures = [];
    const expectation = testCase.expectation;
    const primaryOrientation = scoringKo.primaryOrientation;

    assertCondition(
      benchmarkKo.cohortId === expectation.cohortId,
      `expected cohort ${expectation.cohortId}, received ${benchmarkKo.cohortId}`,
      failures,
    );

    if (expectation.primaryOrientation) {
      assertCondition(
        primaryOrientation?.id === expectation.primaryOrientation,
        `expected primary orientation ${expectation.primaryOrientation}, received ${primaryOrientation?.id ?? "none"}`,
        failures,
      );
    }

    if (typeof expectation.minPrimaryOrientationScore === "number") {
      assertCondition(
        (primaryOrientation?.score ?? 0) >= expectation.minPrimaryOrientationScore,
        `expected primary orientation score >= ${expectation.minPrimaryOrientationScore}, received ${primaryOrientation?.score ?? 0}`,
        failures,
      );
    }

    if (typeof expectation.maxPrimaryOrientationScore === "number") {
      assertCondition(
        (primaryOrientation?.score ?? 0) <= expectation.maxPrimaryOrientationScore,
        `expected primary orientation score <= ${expectation.maxPrimaryOrientationScore}, received ${primaryOrientation?.score ?? 0}`,
        failures,
      );
    }

    if (typeof expectation.minConfidence === "number") {
      assertCondition(
        scoringKo.confidence >= expectation.minConfidence,
        `expected confidence >= ${expectation.minConfidence}, received ${scoringKo.confidence}`,
        failures,
      );
    }

    if (typeof expectation.maxConfidence === "number") {
      assertCondition(
        scoringKo.confidence <= expectation.maxConfidence,
        `expected confidence <= ${expectation.maxConfidence}, received ${scoringKo.confidence}`,
        failures,
      );
    }

    if (typeof expectation.minProjectCount === "number") {
      assertCondition(
        analysisKo.projects.length >= expectation.minProjectCount,
        `expected at least ${expectation.minProjectCount} projects, received ${analysisKo.projects.length}`,
        failures,
      );
    }

    if (expectation.requiredSignalIds?.length) {
      expectation.requiredSignalIds.forEach((signalId) => {
        assertCondition(
          scoringKo.matchedSignalIds.includes(signalId),
          `expected matched signal ${signalId}`,
          failures,
        );
      });
    }

    if (expectation.requiredRoleIds?.length) {
      expectation.requiredRoleIds.forEach((roleId) => {
        assertCondition(
          scoringKo.matchedRoleIds.includes(roleId),
          `expected matched role ${roleId}`,
          failures,
        );
      });
    }

    if (expectation.requiredWorkingStyles?.length) {
      const minimumScore = expectation.minWorkingStyleScore ?? 35;
      expectation.requiredWorkingStyles.forEach((styleId) => {
        assertCondition(
          (scoringKo.workingStyleScores[styleId] ?? 0) >= minimumScore,
          `expected working style ${styleId} >= ${minimumScore}, received ${scoringKo.workingStyleScores[styleId] ?? 0}`,
          failures,
        );
      });
    }

    assertCondition(
      Boolean(analysisKo.profile.headline.trim()),
      "expected Korean headline to be non-empty",
      failures,
    );
    assertCondition(
      Boolean(analysisEn.profile.headline.trim()),
      "expected English headline to be non-empty",
      failures,
    );
    assertCondition(
      Boolean(benchmarkEn.insight.trim()),
      "expected English benchmark insight to be non-empty",
      failures,
    );

    return {
      benchmarkInsight: benchmarkKo.insight,
      cohortId: benchmarkKo.cohortId,
      confidence: scoringKo.confidence,
      description: testCase.description,
      failures,
      id: testCase.id,
      matchedRoleIds: scoringKo.matchedRoleIds,
      matchedSignalIds: scoringKo.matchedSignalIds,
      ok: failures.length === 0,
      primaryOrientation: primaryOrientation?.id ?? null,
      primaryOrientationScore: primaryOrientation?.score ?? 0,
      topWorkingStyles: summarizeTopWorkingStyles(scoringKo),
    };
  });

  writeReports(results);

  console.table(
    results.map((result) => ({
      case: result.id,
      cohort: result.cohortId,
      confidence: result.confidence,
      orientation: result.primaryOrientation ?? "-",
      score: result.primaryOrientationScore,
      status: result.ok ? "pass" : "fail",
    })),
  );

  const failed = results.filter((result) => !result.ok);
  if (failed.length > 0) {
    failed.forEach((result) => {
      console.error(`\n[${result.id}] ${result.description}`);
      result.failures.forEach((failure) => {
        console.error(`- ${failure}`);
      });
    });
    console.error(`\nRegression report written to ${reportPath}`);
    process.exit(1);
  }

  console.log(`\nAll regression cases passed. Report written to ${reportPath}`);
}

main();
