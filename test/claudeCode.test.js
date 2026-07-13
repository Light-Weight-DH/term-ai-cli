import test from "node:test";
import assert from "node:assert/strict";

import { buildClaudeArgs, buildClaudeInput } from "../src/providers/claudeCode.js";

test("claude code provider keeps space-containing prompts out of shell arguments", () => {
  const systemPrompt = "시스템 프롬프트 전달 테스트";
  const userPrompt = "터미널 명령 생성 테스트";

  const args = buildClaudeArgs({ model: "sonnet" });
  const input = buildClaudeInput({ systemPrompt, userPrompt });

  assert.deepEqual(args, ["-p", "--output-format", "json", "--input-format", "text", "--model", "sonnet"]);
  assert.equal(args.includes(systemPrompt), false);
  assert.equal(args.includes(userPrompt), false);
  assert.match(input, /시스템 프롬프트 전달 테스트/);
  assert.match(input, /터미널 명령 생성 테스트/);
});
