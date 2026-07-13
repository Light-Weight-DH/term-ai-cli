import test from "node:test";
import assert from "node:assert/strict";

import {
  buildPowerShellClarificationArgs,
  sanitizeWindowsClarificationAnswer
} from "../src/session/windowsClarificationPrompt.js";

test("sanitizeWindowsClarificationAnswer strips terminal fragments from final line input", () => {
  const answer = ";8;0;0;1_포트 8000;32;1;0;1_확인56;1;0;1_";

  assert.equal(sanitizeWindowsClarificationAnswer(answer), "포트 8000확인");
});

test("sanitizeWindowsClarificationAnswer preserves normal numbers while removing key fragments", () => {
  assert.equal(sanitizeWindowsClarificationAnswer("포트 8000;32;1;0;1_확인"), "포트 8000확인");
  assert.equal(sanitizeWindowsClarificationAnswer("56;1;0;1_포트 8000"), "포트 8000");
});

test("sanitizeWindowsClarificationAnswer keeps plain text untouched", () => {
  assert.equal(sanitizeWindowsClarificationAnswer("port 8000 확인"), "port 8000 확인");
});

test("buildPowerShellClarificationArgs writes console input to a temp file", () => {
  const args = buildPowerShellClarificationArgs("C:\\Temp\\term-ai answer's.txt");

  assert.equal(args[0], "-NoProfile");
  assert.equal(args[1], "-Command");
  assert.match(args[2], /\[Console\]::ReadLine\(\)/);
  assert.match(args[2], /Set-Content -LiteralPath/);
  assert.match(args[2], /term-ai answer''s\.txt/);
});
