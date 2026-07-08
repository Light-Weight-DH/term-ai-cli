const CONTEXT_HINTS = [
  "방금",
  "아까",
  "이전",
  "위에",
  "위의",
  "최근",
  "마지막",
  "실패",
  "에러",
  "오류",
  "출력",
  "로그",
  "결과",
  "그거",
  "그 파일",
  "해당",
  "현재 프로젝트",
  "이 프로젝트",
  "repo",
  "repository",
  "git",
  "npm",
  "package",
  "server",
  "서버",
  "프로세스"
];

const SELF_CONTAINED_PATTERNS = [
  /포트\s*\d+/i,
  /port\s*\d+/i,
  /\b\d{2,5}\s*포트/i,
  /현재\s*폴더|현재\s*디렉토리|working directory|pwd/i,
  /아이피|ip\s*(주소)?/i,
  /디스크|용량|disk/i,
  /메모리|memory/i,
  /프로세스\s*(목록|확인)|process list/i,
  /날짜|시간|date|time/i
];

const AMBIGUOUS_PATTERNS = [
  /방금|아까|이전|위에|위의|최근|마지막/,
  /고쳐|수정|다시\s*실행|재시작|열어줘|찾아줘/,
  /실패|에러|오류|로그|결과|출력/,
  /그거|그 파일|해당/
];

export function routeContextUsage({ mainRequest, supplementalDetails = [] }) {
  const normalized = [mainRequest, ...supplementalDetails].join("\n").trim();

  if (SELF_CONTAINED_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return { includeSession: false, reason: "self-contained-command" };
  }

  if (AMBIGUOUS_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return { includeSession: true, reason: "context-dependent-language" };
  }

  const lower = normalized.toLowerCase();
  if (CONTEXT_HINTS.some((hint) => lower.includes(hint.toLowerCase()))) {
    return { includeSession: true, reason: "context-hint" };
  }

  return { includeSession: false, reason: "default-self-contained" };
}
