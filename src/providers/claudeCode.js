import { spawn } from "child_process";

export function buildClaudeArgs({ model }) {
  const args = ["-p", "--output-format", "json", "--input-format", "text"];

  if (model) {
    args.push("--model", model);
  }

  return args;
}

export function buildClaudeInput({ systemPrompt, userPrompt }) {
  return `${systemPrompt}\n\n---\n\n${userPrompt}`;
}

function extractResult(stdout) {
  const parsed = JSON.parse(stdout);

  if (parsed.is_error) {
    throw new Error(parsed.result || "Claude Code 실행이 실패했습니다.");
  }

  if (typeof parsed.result !== "string") {
    throw new Error("Claude Code 응답에서 result 필드를 찾을 수 없습니다.");
  }

  return parsed.result.trim();
}

export function generate({ config, systemPrompt, userPrompt }) {
  return new Promise((resolve, reject) => {
    const binary = config.claudeBinary || "claude";
    const args = buildClaudeArgs({ model: config.model });
    const input = buildClaudeInput({ systemPrompt, userPrompt });
    const child = spawn(binary, args, {
      shell: process.platform === "win32",
      stdio: ["pipe", "pipe", "pipe"]
    });

    let stdout = "";
    let stderr = "";
    let settled = false;

    const fail = (err) => {
      if (settled) return;
      settled = true;
      reject(err);
    };

    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    child.stdin.on("error", (err) => {
      fail(new Error(`claude stdin 쓰기 실패: ${err.message}`));
    });

    child.on("error", (err) => {
      fail(
        new Error(
          `claude 실행 파일을 찾을 수 없습니다 (${binary}). 설치 및 로그인 상태를 확인하세요. 원본 오류: ${err.message}`
        )
      );
    });

    child.on("close", (code) => {
      if (settled) return;
      settled = true;

      if (code !== 0) {
        reject(new Error(`claude 실행 실패 (exit ${code}): ${stderr}`));
        return;
      }

      try {
        resolve(extractResult(stdout));
      } catch (err) {
        reject(new Error(`Claude Code 응답을 해석할 수 없습니다: ${err.message}`));
      }
    });

    child.stdin.end(input, "utf-8");
  });
}
