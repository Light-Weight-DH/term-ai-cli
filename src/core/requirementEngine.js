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
    this.activeTurn = null;
  }

  startTurn(mainRequest) {
    this.activeTurn = {
      mainRequest,
      supplementalDetails: []
    };
  }

  appendFollowUp(detailText) {
    if (!this.activeTurn) {
      this.startTurn(detailText);
      return;
    }

    this.activeTurn.supplementalDetails.push(detailText);
  }

  async submitMain(userText) {
    this.startTurn(userText);
    return this.runActiveTurn();
  }

  async submitFollowUp(userText) {
    this.appendFollowUp(userText);
    return this.runActiveTurn();
  }

  async runActiveTurn() {
    if (!this.activeTurn) {
      return { type: "error", raw: "활성 요청이 없습니다." };
    }

    const route = routeContextUsage(this.activeTurn);
    const sessionSnapshot = route.includeSession ? this.sessionLog.snapshot() : null;

    const systemPrompt = buildSystemPrompt({
      shell: this.shell,
      platform: this.platform,
      includeSession: route.includeSession
    });
    const userPrompt = buildUserPrompt({
      mainRequest: this.activeTurn.mainRequest,
      supplementalDetails: this.activeTurn.supplementalDetails,
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
      this.reset();
      return { type: "command", command: parsed.command, explanation: parsed.explanation };
    }

    return { type: "error", raw };
  }

  async submit(userText) {
    return this.submitMain(userText);
  }

  reset() {
    this.activeTurn = null;
  }
}
