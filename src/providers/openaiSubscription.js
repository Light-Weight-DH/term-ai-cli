import { spawn } from "child_process";
import { mkdtemp, readFile, rm } from "fs/promises";
import os from "os";
import path from "path";

function buildCodexArgs({ model, outputPath }) {
  const args = [
    "exec",
    "--skip-git-repo-check",
    "--ephemeral",
    "--ignore-rules",
    "--sandbox",
    "read-only",
    "--output-last-message",
    outputPath
  ];

  if (model) {
    args.push("--model", model);
  }

  args.push("-");
  return args;
}

// 자체 OAuth 재구현 대신, 사용자가 이미 `codex login`으로 인증해둔
// 공식 Codex CLI를 서브프로세스로 실행해서 ChatGPT 구독 기반 사용량을 그대로 활용한다.
// 전제조건: `codex` 바이너리가 PATH에 있고 로그인이 완료되어 있어야 함.
export async function generate({ config, systemPrompt, userPrompt }) {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "term-ai-codex-"));
  const outputPath = path.join(tempDir, "last-message.txt");

  try {
    return await new Promise((resolve, reject) => {
      const binary = config.codexBinary || "codex";
      const combinedPrompt = `${systemPrompt}\n\n---\n\n${userPrompt}`;
      const args = buildCodexArgs({ model: config.model, outputPath });
      const child = spawn(binary, args, {
        shell: process.platform === "win32",
        stdio: ["pipe", "pipe", "pipe"]
      });

      let stdout = "";
      let stderr = "";
      let settled = false;

      const fail = (error) => {
        if (settled) return;
        settled = true;
        reject(error);
      };

      child.stdout.on("data", (d) => (stdout += d.toString()));
      child.stderr.on("data", (d) => (stderr += d.toString()));
      child.stdin.on("error", (err) => {
        fail(new Error(`codex stdin 쓰기 실패: ${err.message}`));
      });

      child.on("error", (err) => {
        fail(
          new Error(
            `codex 실행 파일을 찾을 수 없습니다 (${binary}). 설치 및 'codex login' 완료 여부를 확인하세요. 원본 오류: ${err.message}`
          )
        );
      });

      child.on("close", async (code) => {
        if (settled) return;
        settled = true;

        if (code !== 0) {
          reject(new Error(`codex 실행 실패 (exit ${code}): ${stderr}`));
          return;
        }

        try {
          const lastMessage = await readFile(outputPath, "utf-8");
          resolve(lastMessage.trim() || stdout.trim());
        } catch (err) {
          reject(new Error(`codex 응답 파일을 읽을 수 없습니다: ${err.message}`));
        }
      });

      child.stdin.end(combinedPrompt, "utf-8");
    });
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}
