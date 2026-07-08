import { buildSystemPrompt, buildUserPrompt } from "./promptBuilder.js";
import { routeContextUsage } from "./contextRouter.js";

function safeParseJson(text) {
  // 모델이 실수로 코드블록(```json ... ```)을 붙이는 경우 제거
  const cleaned = text.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

export class RequirementEngine {
  constructor({ provider, shell, platform, sessionLog }) {
    this.provider = provider;
    this.shell = shell;
    this.platform = platform;
    this.sessionLog = sessionLog;
    this.requirementHistory = []; // [요구사항, 추가정보1, 추가정보2, ...]
  }

  // 사용자가 새 텍스트(최초 요구사항 또는 추가 정보)를 입력했을 때 호출
  async submit(userText) {
    this.requirementHistory.push(userText);
    const route = routeContextUsage(userText, this.requirementHistory.length > 1);
    const sessionSnapshot = route.includeSession ? this.sessionLog.snapshot() : null;

    const systemPrompt = buildSystemPrompt({
      shell: this.shell,
      platform: this.platform,
      includeSession: route.includeSession
    });
    const userPrompt = buildUserPrompt({
      requirementHistory: this.requirementHistory,
      sessionSnapshot,
      includeSession: route.includeSession,
      routeReason: route.reason
    });

    const raw = await this.provider.generate({ systemPrompt, userPrompt });
    const parsed = safeParseJson(raw);

    if (!parsed || !parsed.type) {
      // 모델이 형식을 안 지켰을 때의 폴백: 원문을 그대로 노출
      return { type: "error", raw };
    }

    if (parsed.type === "clarify") {
      return { type: "clarify", question: parsed.question };
    }

    if (parsed.type === "command") {
      // 명령이 확정되었으므로 다음 요청을 위해 히스토리 초기화(원하면 유지하도록 바꿀 수 있음)
      return { type: "command", command: parsed.command, explanation: parsed.explanation };
    }

    return { type: "error", raw };
  }

  reset() {
    this.requirementHistory = [];
  }
}
