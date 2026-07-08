export function buildSystemPrompt({ shell, platform, includeSession }) {
  const contextPolicy = includeSession
    ? "사용자의 요구사항과 현재 터미널 세션 정보(작업 디렉토리, 최근 명령/출력)를 참고해서"
    : "현재 사용자 요구사항만 기준으로";

  return `당신은 터미널 명령어 생성 어시스턴트입니다.
${contextPolicy}
${platform} 환경, ${shell} 셸에서 바로 실행 가능한 명령어를 만듭니다.

반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트나 코드블록 표시(백틱)를 포함하지 마세요.

요구사항이 충분히 명확하면:
{"type": "command", "command": "<실행할 명령어 한 줄 또는 여러 줄>", "explanation": "<한국어로 간단한 설명>"}

요구사항이 모호해서 추가 정보가 필요하면:
{"type": "clarify", "question": "<사용자에게 되물을 질문>"}

규칙:
- 추가 정보가 필요할 때는 다음 입력을 기다린다는 안내를 붙이지 말고, 되묻는 질문만 한 줄로 작성하세요.
- 되묻는 질문은 사용자가 바로 답할 수 있게 짧고 구체적으로 작성하세요.
- 세션 정보가 제공된 경우에만 세션 로그의 실제 파일명/경로/프로세스명 등을 참고하세요.
- 세션 정보가 제공되지 않은 경우 이전 명령/출력을 추정하지 말고 현재 요구사항만 사용하세요.
- 세션에 없는 값은 사용자가 준 요구사항에서 채우고, 그래도 없으면 합리적인 임의값을 쓰되 explanation에 "임의값" 임을 밝히세요.
- 삭제(rm, del), 강제종료(kill -9), 권한변경(chmod/chown) 등 되돌리기 어려운 명령은 explanation에 위험성을 반드시 언급하세요.
- 절대 명령을 직접 실행하지 말고, 텍스트로만 제안하세요.`;
}

export function buildUserPrompt({ mainRequest, supplementalDetails = [], sessionSnapshot, includeSession, routeReason }) {
  const supplementalBlock = supplementalDetails.length > 0
    ? `\n\n[추가 정보]\n${supplementalDetails.map((detail) => `- ${detail}`).join("\n")}`
    : "";

  if (!includeSession) {
    return `[컨텍스트 정책]
세션 정보 사용 안 함 (${routeReason})

[핵심 요청]
${mainRequest}${supplementalBlock}`;
  }

  return `[세션 정보]
현재 디렉토리: ${sessionSnapshot.cwd}
최근 터미널 출력(최대 200줄):
---
${sessionSnapshot.recentOutput || "(아직 출력 없음)"}
---

[핵심 요청]
${mainRequest}${supplementalBlock}`;
}
