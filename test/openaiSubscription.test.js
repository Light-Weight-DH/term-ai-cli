import test from "node:test";
import assert from "node:assert/strict";

import { buildCodexArgs, extractCodexStdout } from "../src/providers/openaiSubscription.js";

test("codex subscription uses conservative exec flags for older cli versions", () => {
  const args = buildCodexArgs({ model: "gpt-5.5", outputPath: "/tmp/last-message.txt" });

  assert.deepEqual(args, [
    "exec",
    "--skip-git-repo-check",
    "--ephemeral",
    "--output-last-message",
    "/tmp/last-message.txt",
    "--model",
    "gpt-5.5",
    "-"
  ]);
  assert.equal(args.includes("--ignore-rules"), false);
  assert.equal(args.includes("--sandbox"), false);
});

test("codex subscription can omit output-last-message for fallback mode", () => {
  const args = buildCodexArgs({ model: "gpt-5.5" });

  assert.deepEqual(args, ["exec", "--skip-git-repo-check", "--ephemeral", "--model", "gpt-5.5", "-"]);
});

test("codex subscription can ignore user config after config schema failures", () => {
  const args = buildCodexArgs({ model: "gpt-5.5", outputPath: "/tmp/last-message.txt", ignoreUserConfig: true });

  assert.deepEqual(args, [
    "exec",
    "--skip-git-repo-check",
    "--ephemeral",
    "--ignore-user-config",
    "--output-last-message",
    "/tmp/last-message.txt",
    "--model",
    "gpt-5.5",
    "-"
  ]);
});

test("codex fallback output uses the last non-empty stdout line", () => {
  const stdout = [
    "OpenAI Codex v0.142.5",
    "tokens used",
    "18,185",
    "{\"type\":\"command\",\"command\":\"echo ok\",\"explanation\":\"ok\"}",
    ""
  ].join("\n");

  assert.equal(extractCodexStdout(stdout), "{\"type\":\"command\",\"command\":\"echo ok\",\"explanation\":\"ok\"}");
});
