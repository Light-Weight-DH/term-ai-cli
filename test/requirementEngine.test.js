import test from "node:test";
import assert from "node:assert/strict";

import { RequirementEngine } from "../src/core/requirementEngine.js";

function createSessionLog() {
  return {
    snapshot() {
      return {
        cwd: "/Users/test/project",
        recentOutput: "term-ai ready"
      };
    }
  };
}

test("clarification follow-up is sent as direct supplemental input, not a new #ai request", async () => {
  const calls = [];
  const provider = {
    async generate(payload) {
      calls.push(payload);

      if (calls.length === 1) {
        return JSON.stringify({
          type: "clarify",
          question: "정확히 어떤 사용량을 말하는지 알려주세요."
        });
      }

      return JSON.stringify({
        type: "command",
        command: "codex status",
        explanation: "세션 사용량을 확인합니다."
      });
    }
  };

  const engine = new RequirementEngine({
    provider,
    shell: "bash",
    platform: "darwin",
    sessionLog: createSessionLog()
  });

  const first = await engine.submitMain("코덱스 사용량 확인");
  assert.equal(first.type, "clarify");

  const second = await engine.submitFollowUp("코덱스 세션에서 모델 사용량 현황");
  assert.equal(second.type, "command");

  assert.match(calls[1].userPrompt, /\[핵심 요청\]/);
  assert.match(calls[1].userPrompt, /코덱스 사용량 확인/);
  assert.match(calls[1].userPrompt, /\[추가 정보\]/);
  assert.match(calls[1].userPrompt, /코덱스 세션에서 모델 사용량 현황/);
  assert.doesNotMatch(calls[1].userPrompt, /#ai/);
});
